import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sku?: string;

  @IsUUID()
  categoryId!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ingredientsText?: string;

  @IsInt()
  @Min(0, { message: 'El precio no puede ser negativo.' })
  priceCents!: number;

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
}
