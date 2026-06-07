import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { User } from './database/entities/user.entity';
import { RefreshToken } from './database/entities/refresh-token.entity';
import { Category } from './database/entities/category.entity';
import { Product } from './database/entities/product.entity';
import { SubscriptionPlan } from './database/entities/subscription-plan.entity';
import { Subscription } from './database/entities/subscription.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.user'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.name'),
        entities: [User, RefreshToken, Category, Product, SubscriptionPlan, Subscription],
        // El esquema lo gestionan database/schema.sql + migraciones, no TypeORM.
        synchronize: false,
      }),
    }),
    AuthModule,
    UsersModule,
    CatalogModule,
    SubscriptionsModule,
  ],
  providers: [
    // JWT obligatorio por defecto en toda la API; usar @Public() para abrir.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
