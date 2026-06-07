import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { AuthProvider, Role } from '../common/enums/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';

export interface CreateUserData {
  email: string;
  fullName: string;
  passwordHash?: string | null;
  phone?: string | null;
  role?: Role;
  authProvider?: AuthProvider;
  emailVerified?: boolean;
}

/**
 * Vista pública de un usuario: nunca incluye el passwordHash.
 */
export type PublicUser = Omit<User, 'passwordHash' | 'refreshTokens'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  /** Quita campos sensibles antes de exponer un usuario. */
  static toPublic(user: User): PublicUser {
    const { passwordHash, refreshTokens, ...rest } = user;
    void passwordHash;
    void refreshTokens;
    return rest;
  }

  async create(data: CreateUserData): Promise<User> {
    const existing = await this.users.findOne({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese email.');
    }
    const user = this.users.create({
      email: data.email,
      fullName: data.fullName,
      passwordHash: data.passwordHash ?? null,
      phone: data.phone ?? null,
      role: data.role ?? Role.CLIENTE,
      authProvider: data.authProvider ?? AuthProvider.EMAIL,
      emailVerified: data.emailVerified ?? false,
    });
    return this.users.save(user);
  }

  /** Incluye el passwordHash: solo para uso interno del AuthService. */
  findByEmailWithSecret(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async getProfile(id: string): Promise<PublicUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return UsersService.toPublic(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    const saved = await this.users.save(user);
    return UsersService.toPublic(saved);
  }

  async findAll(): Promise<PublicUser[]> {
    const all = await this.users.find({ order: { createdAt: 'DESC' } });
    return all.map((u) => UsersService.toPublic(u));
  }
}
