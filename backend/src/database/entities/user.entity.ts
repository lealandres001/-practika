import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuthProvider, Role } from '../../common/enums/role.enum';
import { RefreshToken } from './refresh-token.entity';

/**
 * Mapea la tabla `users` definida en database/schema.sql.
 */
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'citext' })
  email!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 160 })
  fullName!: string;

  // Nunca se expone al cliente (ver transformaciones en el servicio/DTO).
  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash?: string | null;

  @Column({
    name: 'auth_provider',
    type: 'enum',
    enum: AuthProvider,
    enumName: 'auth_provider',
    default: AuthProvider.EMAIL,
  })
  authProvider!: AuthProvider;

  @Column({ name: 'provider_user_id', type: 'varchar', length: 255, nullable: true })
  providerUserId?: string | null;

  @Column({
    type: 'enum',
    enum: Role,
    enumName: 'user_role',
    default: Role.CLIENTE,
  })
  role!: Role;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}
