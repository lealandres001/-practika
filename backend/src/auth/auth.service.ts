import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { User } from '../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokens, JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  // ---- Registro ----
  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.users.create({
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      passwordHash,
    });
    const tokens = await this.issueTokens(user);
    return { user: UsersService.toPublic(user), ...tokens };
  }

  // ---- Login ----
  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithSecret(dto.email);
    // Verificación en tiempo (más o menos) constante: si no hay hash, igual
    // ejecutamos un verify dummy para no filtrar si el email existe.
    const validPassword = user?.passwordHash
      ? await argon2.verify(user.passwordHash, dto.password)
      : await this.dummyVerify(dto.password);

    if (!user || !validPassword) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta está inactiva.');
    }

    const tokens = await this.issueTokens(user);
    return { user: UsersService.toPublic(user), ...tokens };
  }

  // ---- Refresh (con rotación) ----
  async refresh(presentedToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(presentedToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    const tokenHash = this.hashToken(presentedToken);
    const stored = await this.refreshTokens.findOne({
      where: { userId: payload.sub, tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesión no válida. Inicia sesión de nuevo.');
    }

    // Rotación: revocamos el actual y emitimos uno nuevo.
    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Cuenta inactiva.');
    }
    return this.issueTokens(user);
  }

  // ---- Logout ----
  async logout(userId: string, presentedToken: string): Promise<void> {
    const tokenHash = this.hashToken(presentedToken);
    await this.refreshTokens.update(
      { userId, tokenHash },
      { revokedAt: new Date() },
    );
  }

  // ---- Helpers internos ----
  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessTtl'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshTtl'),
    });

    // Persistimos el HASH del refresh token para poder revocarlo/rotarlo.
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      }),
    );

    // Limpieza oportunista de tokens vencidos del usuario.
    await this.refreshTokens.delete({
      userId: user.id,
      expiresAt: LessThan(new Date()),
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async dummyVerify(password: string): Promise<boolean> {
    // Hash fijo para mitigar ataques de enumeración por tiempo de respuesta.
    const dummy =
      '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaaJObG';
    await argon2.verify(dummy, password).catch(() => false);
    return false;
  }
}
