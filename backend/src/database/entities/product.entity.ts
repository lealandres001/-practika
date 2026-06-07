import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

/**
 * Mapea la tabla `products`. Los precios se guardan en centavos (priceCents).
 */
@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40, nullable: true })
  sku?: string | null;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'ingredients_text', type: 'text', nullable: true })
  ingredientsText?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  nutrition?: Record<string, unknown> | null;

  @Column({ name: 'price_cents', type: 'integer' })
  priceCents!: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  unit?: string | null;

  @Column({ name: 'weight_grams', type: 'integer', nullable: true })
  weightGrams?: number | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ name: 'vacuum_sealed', type: 'boolean', default: true })
  vacuumSealed!: boolean;

  @Column({ name: 'shelf_life_days', type: 'integer', nullable: true })
  shelfLifeDays?: number | null;

  @Column({ name: 'suggested_stock', type: 'integer', default: 0 })
  suggestedStock!: number;

  @Column({ type: 'boolean', default: true })
  available!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
