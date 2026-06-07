import { Role } from '../../common/enums/role.enum';

/**
 * Contenido del access token JWT.
 */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
