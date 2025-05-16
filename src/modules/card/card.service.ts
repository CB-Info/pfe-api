import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CardDTO } from 'src/dto/card.dto';
import { CardResponseDTO } from 'src/dto/response/card.response.dto';
import { CardRepository } from 'src/mongo/repositories/card.repository';

@Injectable()
export class CardService {
  constructor(private readonly cardRepository: CardRepository) {}

  async createOne(cardData: CardDTO): Promise<CardResponseDTO> {
    try {
      const created = await this.cardRepository.insert({
        name: cardData.name,
        dishesId: cardData.dishesId.map((id) => new Types.ObjectId(id)),
        isActive: cardData.isActive,
      });
      return this.toResponseDTO(created);
    } catch (e) {
      if (e.name === 'ValidationError') {
        throw new BadRequestException(e.message);
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async findAll(): Promise<CardResponseDTO[]> {
    try {
      const cards = await this.cardRepository.findAll({
        populate: ['dishesId'],
      });
      return cards.map((c) => this.toResponseDTO(c));
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  async findOne(id: string): Promise<CardResponseDTO> {
    try {
      const card = await this.cardRepository.findOneBy(
        { _id: id },
        { populate: ['dishesId'] },
      );
      if (!card) throw new NotFoundException(`Carte ${id} introuvable`);
      return this.toResponseDTO(card);
    } catch (e) {
      if (e.name === 'CastError') {
        throw new BadRequestException('Identifiant invalide');
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async updateOne(id: string, cardData: CardDTO): Promise<CardResponseDTO> {
    try {
      const isUpdated = await this.cardRepository.updateOneBy(
        { _id: id },
        {
          name: cardData.name,
          dishesId: cardData.dishesId.map((i) => new Types.ObjectId(i)),
          isActive: cardData.isActive,
        },
      );
      if (!isUpdated) {
        throw new NotFoundException(`Carte ${id} introuvable`);
      }
      const reloaded = await this.cardRepository.findOneBy(
        { _id: id },
        { populate: ['dishesId'] },
      );
      if (!reloaded) {
        throw new InternalServerErrorException(
          `Erreur de rechargement de la carte ${id}`,
        );
      }
      return this.toResponseDTO(reloaded);
    } catch (e) {
      if (e.name === 'CastError') {
        throw new BadRequestException('Identifiant invalide');
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async addDish(cardId: string, newDishId: string): Promise<CardResponseDTO> {
    const card = await this.findOne(cardId);
    if (card.dishes.some((d) => d._id === newDishId)) {
      throw new BadRequestException(`Plat ${newDishId} déjà présent`);
    }
    await this.cardRepository.pushArray(
      { _id: cardId },
      { dishesId: new Types.ObjectId(newDishId) },
    );
    return this.findOne(cardId);
  }

  async removeDish(cardId: string, dishId: string): Promise<CardResponseDTO> {
    await this.cardRepository.pullArray(
      { _id: cardId },
      { dishesId: new Types.ObjectId(dishId) },
    );
    return this.findOne(cardId);
  }

  async deleteOne(id: string): Promise<void> {
    const deleted = await this.cardRepository.deleteOneBy({ _id: id });
    if (!deleted) throw new NotFoundException(`Carte ${id} introuvable`);
  }

  /** Convertit un Document (avec dishesId peuplé) en CardResponseDTO */
  private toResponseDTO(card: any): CardResponseDTO {
    return {
      _id: card._id.toString(),
      name: card.name,
      dishes: card.dishesId.map((dish: any) => ({
        _id: dish._id.toString(),
        name: dish.name,
        ingredients: dish.ingredients.map((ing: any) => ({
          ingredientRef: {
            _id: ing.ingredient?._id.toString(),
            name: ing.ingredient?.name,
          },
          unity: ing.unity,
          quantity: ing.quantity,
        })),
        price: dish.price,
        description: dish.description,
        category: dish.category,
        timeCook: dish.timeCook,
        isAvailable: dish.isAvailable,
      })),
      isActive: card.isActive,
      dateOfCreation: card.dateOfCreation,
      dateLastModified: card.dateLastModified,
    };
  }
}
