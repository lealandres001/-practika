import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller()
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  // ---- Planes ----
  @Public()
  @Get('plans')
  listPlans() {
    return this.service.listPlans();
  }

  @Post('plans')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  createPlan(@Body() dto: CreatePlanDto) {
    return this.service.createPlan(dto);
  }

  // ---- Suscripciones del cliente autenticado ----
  @Get('subscriptions')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.service.listMine(user.sub);
  }

  @Post('subscriptions')
  subscribe(@CurrentUser() user: JwtPayload, @Body() dto: SubscribeDto) {
    return this.service.subscribe(user.sub, dto);
  }

  @Post('subscriptions/:id/pause')
  pause(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.pause(user.sub, id);
  }

  @Post('subscriptions/:id/resume')
  resume(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resume(user.sub, id);
  }

  @Post('subscriptions/:id/cancel')
  cancel(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(user.sub, id);
  }
}
