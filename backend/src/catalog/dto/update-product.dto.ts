import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Actualización parcial de un producto. Todos los campos son opcionales.
 */
export class UpdateProductDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ingredientsText?: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El precio no puede ser negativo.' })
  priceCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  vacuumSealed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  shelfLifeDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  suggestedStock?: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
