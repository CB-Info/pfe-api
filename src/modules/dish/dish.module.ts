import { Module } from '@nestjs/common';
import { MongoModule } from '../../mongo/mongo.module';
import { DishController } from './dish.controller';
import { DishService } from './dish.service';
import { RolesGuard } from '../../guards/roles.guard';

@Module({
  imports: [MongoModule],
  controllers: [DishController],
  providers: [DishService, RolesGuard],
})
export class DishModule {}
