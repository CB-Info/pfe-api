import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import config from './configs/config';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { CardModule } from './modules/card/card.module';
import { DishModule } from './modules/dish/dish.module';
import { OrderModule } from './modules/order/order.module';
import { StockModule } from './modules/stock/stock.module';
import { RestaurantTableModule } from './modules/table/restaurant.table.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    MongooseModule.forRoot(config().mongoUrl),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 10000, // 10 seconds
        limit: 3, // 3 requests per 10 seconds (for testing)
      },
      {
        name: 'medium',
        ttl: 30000, // 30 seconds
        limit: 20, // 20 requests per 30 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
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
