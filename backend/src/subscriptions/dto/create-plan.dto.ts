import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DeliveryFrequency } from '../../database/entities/subscription-plan.entity';

export class CreatePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sku?: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  priceMonthlyCents!: number;

  @IsEnum(DeliveryFrequency)
  frequency!: DeliveryFrequency;

  @IsInt()
  @Min(1)
  deliveriesPerMonth!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoriesIncluded?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
