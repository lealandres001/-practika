import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum DeliveryFrequency {
  SEMANAL = 'semanal',
  QUINCENAL = 'quincenal',
  MENSUAL = 'mensual',
}

/**
 * Mapea la tabla `subscription_plans`.
 */
@Entity({ name: 'subscription_plans' })
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40, nullable: true })
  sku?: string | null;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'price_monthly_cents', type: 'integer' })
  priceMonthlyCents!: number;

  @Column({
    type: 'enum',
    enum: DeliveryFrequency,
    enumName: 'delivery_frequency',
  })
  frequency!: DeliveryFrequency;

  @Column({ name: 'deliveries_per_month', type: 'smallint' })
  deliveriesPerMonth!: number;

  @Column({ name: 'categories_included', type: 'jsonb', nullable: true })
  categoriesIncluded?: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  features?: string[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
