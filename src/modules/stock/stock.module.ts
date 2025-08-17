import { Module } from '@nestjs/common';
import { MongoModule } from '../../mongo/mongo.module';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { RolesGuard } from '../../guards/roles.guard';

@Module({
  imports: [MongoModule],
  controllers: [StockController],
  providers: [StockService, RolesGuard],
})
export class StockModule {}
