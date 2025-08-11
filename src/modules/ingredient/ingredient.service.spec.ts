import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { IngredientRepository } from 'src/mongo/repositories/ingredient.repository';

const repo = {
  insert: jest.fn(),
  findAll: jest.fn(),
  findOneBy: jest.fn(),
  updateOneBy: jest.fn(),
  deleteOneBy: jest.fn(),
} as unknown as IngredientRepository;

function createService() {
  return new IngredientService(repo);
}

describe('IngredientService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('createOne should return created ingredient', async () => {
    const created = { toObject: () => ({ _id: '1', name: 'Tomato' }) } as any;
    (repo.insert as any).mockResolvedValue(created);
    const service = createService();
    const result = await service.createOne({ name: 'Tomato' });
    expect(result).toEqual({ _id: '1', name: 'Tomato' });
  });

  it('createOne should map ValidationError to BadRequest', async () => {
    (repo.insert as any).mockRejectedValue({
      name: 'ValidationError',
      message: 'Invalid',
    });
    const service = createService();
    await expect(service.createOne({ name: '' } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('findAll should return list', async () => {
    (repo.findAll as any).mockResolvedValue([{ _id: '1', name: 'A' }]);
    const service = createService();
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('findOne should throw NotFound when missing', async () => {
    (repo.findOneBy as any).mockResolvedValue(null);
    const service = createService();
    await expect(service.findOne('bad')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findOne should translate CastError to BadRequest', async () => {
    (repo.findOneBy as any).mockRejectedValue({
      name: 'CastError',
      message: 'bad id',
    });
    const service = createService();
    await expect(service.findOne('bad')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updateOne should throw NotFound when update returns false', async () => {
    (repo.updateOneBy as any).mockResolvedValue(false);
    const service = createService();
    await expect(service.updateOne('1', { name: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deleteOne should throw NotFound when delete returns false', async () => {
    (repo.deleteOneBy as any).mockResolvedValue(false);
    const service = createService();
    await expect(service.deleteOne('1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
