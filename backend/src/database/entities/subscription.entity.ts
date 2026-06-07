import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum SubscriptionStatus {
  ACTIVA = 'activa',
  PAUSADA = 'pausada',
  CANCELADA = 'cancelada',
  VENCIDA = 'vencida',
}

/**
 * Mapea la tabla `subscriptions`: el contrato de un cliente con un plan.
 */
@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan!: SubscriptionPlan;

  @Index()
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    enumName: 'subscription_status',
    default: SubscriptionStatus.ACTIVA,
  })
  status!: SubscriptionStatus;

  @Column({ name: 'auto_renew', type: 'boolean', default: true })
  autoRenew!: boolean;

  @Column({ name: 'current_period_start', type: 'date' })
  currentPeriodStart!: string;

  @Column({ name: 'current_period_end', type: 'date' })
  currentPeriodEnd!: string;

  @Column({ name: 'paused_at', type: 'timestamptz', nullable: true })
  pausedAt?: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
