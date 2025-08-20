import { Module } from '@nestjs/common';
import { MongoModule } from '../../mongo/mongo.module';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { RolesGuard } from '../../guards/roles.guard';

@Module({
  imports: [MongoModule],
  controllers: [CardController],
  providers: [CardService, RolesGuard],
})
export class CardModule {}
