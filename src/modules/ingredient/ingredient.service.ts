import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IngredientDTO } from 'src/dto/creation/ingredient.dto';
import { Ingredient } from 'src/mongo/models/ingredient.model';
import { DataType } from 'src/mongo/repositories/base.repository';
import { IngredientRepository } from 'src/mongo/repositories/ingredient.repository';

@Injectable()
export class IngredientService {
  constructor(private readonly ingredientRepository: IngredientRepository) {}

  async findByName(searchTerm: string): Promise<Ingredient[]> {
    const regex = new RegExp(searchTerm, 'i'); // 'i' pour une recherche insensible à la casse
    return this.ingredientRepository.findManyBy({ name: { $regex: regex } });
  }

  async createOne(ingredientData: IngredientDTO): Promise<Ingredient> {
    try {
      const response = await this.ingredientRepository.insert({
        name: ingredientData.name,
      });

      return response.toObject({ versionKey: false }) as Ingredient;
    } catch (e) {
      console.log(e);
      if ((e as any).name === 'ValidationError') {
        throw new BadRequestException((e as any).message);
      }
      throw new InternalServerErrorException((e as any).message);
    }
  }

  async findAll(): Promise<Ingredient[]> {
    try {
      const response = await this.ingredientRepository.findAll();

      return response as Ingredient[];
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException((e as any).message);
    }
  }

  async findOne(id: string): Promise<Ingredient> {
    let response: Ingredient | null;
    try {
      response = (await this.ingredientRepository.findOneBy({ _id: id })) as any;
    } catch (e) {
      console.log(e);
      if ((e as any).name == 'CastError') {
        throw new BadRequestException('Invalid ID format');
      }
      throw new InternalServerErrorException((e as any).message);
    }

    if (!response) {
      throw new NotFoundException(`Ingredient with ID ${id} not found`);
    }

    return response as Ingredient;
  }

  async updateOne(id: string, ingredientData: DataType): Promise<Ingredient> {
    let isUpdate: boolean;
    try {
      isUpdate = await this.ingredientRepository.updateOneBy(
        { _id: id },
        ingredientData,
      );
    } catch (e) {
      console.log(e);
      if ((e as any).message.includes('Unable to remove ingredient')) {
        throw new BadRequestException((e as any).message);
      }
      throw new InternalServerErrorException((e as any).message);
    }

    if (!isUpdate) {
      throw new NotFoundException(`Ingredient with ID ${id} not found`);
    }

    const response = await this.findOne(id);
    return response as Ingredient;
  }

  async deleteOne(id: string) {
    let isDeleted: boolean;
    try {
      isDeleted = await this.ingredientRepository.deleteOneBy({
        _id: id,
      });
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException((e as any).message);
    }

    if (!isDeleted) {
      throw new NotFoundException(`Ingredient with ID ${id} not found`);
    }
  }
}
