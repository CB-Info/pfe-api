import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import config, { configValidationSchema } from './configs/config';
import { HealthModule } from './modules/health/health.module';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { CardModule } from './modules/card/card.module';
import { DishModule } from './modules/dish/dish.module';
import { OrderModule } from './modules/order/order.module';
import { StockModule } from './modules/stock/stock.module';
import { RestaurantTableModule } from './modules/table/restaurant.table.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    MongooseModule.forRoot(config().mongoUrl),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 10000, // 10 seconds
        limit: 100, // 100 requests per 10 seconds (for testing)
      },
      {
        name: 'medium',
        ttl: 30000, // 30 seconds
        limit: 200, // 200 requests per 30 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 1000, // 1000 requests per minute
      },
    ]),
    HealthModule,
    IngredientModule,
    CardModule,
    DishModule,
    OrderModule,
    StockModule,
    RestaurantTableModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
