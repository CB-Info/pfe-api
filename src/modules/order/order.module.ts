import { Module } from '@nestjs/common';
import { MongoModule } from '../../mongo/mongo.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { RolesGuard } from '../../guards/roles.guard';

@Module({
  imports: [MongoModule],
  controllers: [OrderController],
  providers: [OrderService, RolesGuard],
})
export class OrderModule {}
