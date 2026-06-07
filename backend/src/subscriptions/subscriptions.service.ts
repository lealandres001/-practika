import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../database/entities/subscription.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly plans: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
  ) {}

  // ---- Planes ----
  listPlans(): Promise<SubscriptionPlan[]> {
    return this.plans.find({ where: { isActive: true } });
  }

  createPlan(dto: CreatePlanDto): Promise<SubscriptionPlan> {
    return this.plans.save(this.plans.create(dto));
  }

  // ---- Suscripciones del cliente ----
  async subscribe(userId: string, dto: SubscribeDto): Promise<Subscription> {
    const plan = await this.plans.findOne({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('El plan indicado no existe o no está activo.');
    }

    // No permitir dos suscripciones activas al mismo plan.
    const existing = await this.subscriptions.findOne({
      where: {
        userId,
        planId: dto.planId,
        status: SubscriptionStatus.ACTIVA,
      },
    });
    if (existing) {
      throw new BadRequestException('Ya tienes una suscripción activa a este plan.');
    }

    const start = new Date();
    const end = this.computePeriodEnd(start);

    const subscription = this.subscriptions.create({
      userId,
      planId: dto.planId,
      status: SubscriptionStatus.ACTIVA,
      autoRenew: dto.autoRenew ?? true,
      currentPeriodStart: start.toISOString().slice(0, 10),
      currentPeriodEnd: end.toISOString().slice(0, 10),
    });
    return this.subscriptions.save(subscription);
  }

  listMine(userId: string): Promise<Subscription[]> {
    return this.subscriptions.find({
      where: { userId },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    });
  }

  async pause(userId: string, id: string): Promise<Subscription> {
    const sub = await this.getOwned(userId, id);
    if (sub.status !== SubscriptionStatus.ACTIVA) {
      throw new BadRequestException('Solo se puede pausar una suscripción activa.');
    }
    sub.status = SubscriptionStatus.PAUSADA;
    sub.pausedAt = new Date();
    return this.subscriptions.save(sub);
  }

  async resume(userId: string, id: string): Promise<Subscription> {
    const sub = await this.getOwned(userId, id);
    if (sub.status !== SubscriptionStatus.PAUSADA) {
      throw new BadRequestException('Solo se puede reanudar una suscripción pausada.');
    }
    sub.status = SubscriptionStatus.ACTIVA;
    sub.pausedAt = null;
    return this.subscriptions.save(sub);
  }

  async cancel(userId: string, id: string): Promise<Subscription> {
    const sub = await this.getOwned(userId, id);
    if (sub.status === SubscriptionStatus.CANCELADA) {
      throw new BadRequestException('La suscripción ya está cancelada.');
    }
    sub.status = SubscriptionStatus.CANCELADA;
    sub.autoRenew = false;
    sub.cancelledAt = new Date();
    return this.subscriptions.save(sub);
  }

  // ---- Helpers ----
  private async getOwned(userId: string, id: string): Promise<Subscription> {
    const sub = await this.subscriptions.findOne({ where: { id } });
    if (!sub || sub.userId !== userId) {
      throw new NotFoundException('Suscripción no encontrada.');
    }
    return sub;
  }

  /** Período de un mes natural desde la fecha de inicio. */
  private computePeriodEnd(start: Date): Date {
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return end;
  }
}
