import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El email no es válido.' })
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72) // límite de bytes que procesa el hashing
  @Matches(/[A-Za-z]/, { message: 'La contraseña debe incluir al menos una letra.' })
  @Matches(/\d/, { message: 'La contraseña debe incluir al menos un número.' })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
