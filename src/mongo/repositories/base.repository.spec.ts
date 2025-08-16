import { Document, Model } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import BaseRepository, {
  AdditionalParams,
  FilterQuery,
  DataType,
} from './base.repository';

// Mock Document interface
interface TestDocument extends Document {
  _id: string;
  name: string;
  email?: string;
  isActive: boolean;
  __v: number;
}

// Mock data
const mockDocumentData = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Document',
  email: 'test@example.com',
  isActive: true,
  __v: 0,
};

const mockDocumentInstance = {
  ...mockDocumentData,
  validate: jest.fn(),
  save: jest.fn(),
  toObject: jest.fn(),
};

// Mock Model
const mockModel = {
  constructor: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  deleteOne: jest.fn(),
  updateOne: jest.fn(),
  create: jest.fn(),
} as any;

// Add chainable methods
const createChainableMock = () => ({
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  toObject: jest.fn(),
});

describe('BaseRepository', () => {
  let repository: BaseRepository<TestDocument>;
  let model: Model<TestDocument>;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup model constructor mock
    (mockModel as any).mockImplementation = jest
      .fn()
      .mockImplementation((data) => ({
        ...mockDocumentInstance,
        ...data,
      }));

    model = mockModel;
    repository = new BaseRepository(model);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
    expect(repository.Model).toBe(model);
  });

  describe('insert', () => {
    it('should insert a document successfully', async () => {
      const insertData = { name: 'New Document', isActive: true };
      const savedDocument = {
        ...mockDocumentInstance,
        ...insertData,
        toObject: jest.fn().mockReturnValue({ ...insertData, _id: 'new-id' }),
      };

      // Mock constructor and instance methods
      const mockInstance = {
        validate: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(savedDocument),
        toObject: jest.fn().mockReturnValue({ ...insertData, _id: 'new-id' }),
      };

      jest.spyOn(repository, 'insert').mockImplementation(async () => {
        await mockInstance.validate();
        const saved = await mockInstance.save();
        return saved.toObject({ versionKey: false });
      });

      const result = await repository.insert(
        insertData as FilterQuery<TestDocument>,
      );

      expect(mockInstance.validate).toHaveBeenCalled();
      expect(mockInstance.save).toHaveBeenCalled();
      expect(result).toEqual({ ...insertData, _id: 'new-id' });
    });

    it('should throw BadRequestException on validation error', async () => {
      const insertData = { name: '', isActive: true }; // Invalid data

      jest
        .spyOn(repository, 'insert')
        .mockRejectedValue(new BadRequestException());

      await expect(
        repository.insert(insertData as FilterQuery<TestDocument>),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on save error', async () => {
      const insertData = { name: 'Test', isActive: true };

      jest
        .spyOn(repository, 'insert')
        .mockRejectedValue(new BadRequestException());

      await expect(
        repository.insert(insertData as FilterQuery<TestDocument>),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOneBy', () => {
    it('should find a document by condition', async () => {
      const condition = { name: 'Test Document' };
      const chainableMock = createChainableMock();
      chainableMock.toObject.mockReturnValue(mockDocumentData);

      model.findOne = jest.fn().mockReturnValue(chainableMock);

      const result = await repository.findOneBy(
        condition as FilterQuery<TestDocument>,
      );

      expect(model.findOne).toHaveBeenCalledWith(condition);
      expect(chainableMock.select).toHaveBeenCalledWith('');
      expect(chainableMock.populate).toHaveBeenCalledWith('');
      expect(result).toEqual(mockDocumentData);
    });

    it('should find document with additional params', async () => {
      const condition = { name: 'Test Document' };
      const params: AdditionalParams = {
        hiddenPropertiesToSelect: ['email'],
        populate: ['author'],
      };
      const chainableMock = createChainableMock();
      chainableMock.toObject.mockReturnValue(mockDocumentData);

      model.findOne = jest.fn().mockReturnValue(chainableMock);

      const result = await repository.findOneBy(
        condition as FilterQuery<TestDocument>,
        params,
      );

      expect(model.findOne).toHaveBeenCalledWith(condition);
      expect(chainableMock.select).toHaveBeenCalledWith('+email');
      expect(chainableMock.populate).toHaveBeenCalledWith('author');
      expect(result).toEqual(mockDocumentData);
    });

    it('should return null when document not found', async () => {
      const condition = { name: 'Nonexistent' };
      const chainableMock = createChainableMock();
      chainableMock.toObject.mockReturnValue(null);

      model.findOne = jest.fn().mockReturnValue(chainableMock);

      const result = await repository.findOneBy(
        condition as FilterQuery<TestDocument>,
      );

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const condition = { name: 'Test Document' };

      model.findOne = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await repository.findOneBy(
        condition as FilterQuery<TestDocument>,
      );

      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('should find a document by ID', async () => {
      const id = '507f1f77bcf86cd799439011';
      jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(mockDocumentData as any);

      const result = await repository.findOneById(id);

      expect(repository.findOneBy).toHaveBeenCalledWith({ _id: id }, undefined);
      expect(result).toEqual(mockDocumentData);
    });

    it('should handle invalid ID format', async () => {
      const id = 'invalid-id';
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      const result = await repository.findOneById(id);

      expect(result).toBeNull();
    });
  });

  describe('deleteOneBy', () => {
    it('should delete a document successfully', async () => {
      const condition = { _id: '507f1f77bcf86cd799439011' };
      model.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

      const result = await repository.deleteOneBy(
        condition as FilterQuery<TestDocument>,
      );

      expect(model.deleteOne).toHaveBeenCalledWith(condition);
      expect(result).toBe(true);
    });

    it('should return false when no document deleted', async () => {
      const condition = { _id: 'nonexistent' };
      model.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 0 });

      const result = await repository.deleteOneBy(
        condition as FilterQuery<TestDocument>,
      );

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const condition = { _id: '507f1f77bcf86cd799439011' };
      model.deleteOne = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await repository.deleteOneBy(
        condition as FilterQuery<TestDocument>,
      );

      expect(result).toBe(false);
    });
  });

  describe('updateOneBy', () => {
    it('should update a document successfully', async () => {
      const condition = { _id: '507f1f77bcf86cd799439011' };
      const updateData: DataType = { name: 'Updated Name' };
      model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      const result = await repository.updateOneBy(
        condition as FilterQuery<TestDocument>,
        updateData,
      );

      expect(model.updateOne).toHaveBeenCalledWith(condition, {
        $set: updateData,
        $inc: { __v: 1 },
      });
      expect(result).toBe(true);
    });

    it('should return false when no document updated', async () => {
      const condition = { _id: 'nonexistent' };
      const updateData: DataType = { name: 'Updated Name' };
      model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 0 });

      const result = await repository.updateOneBy(
        condition as FilterQuery<TestDocument>,
        updateData,
      );

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const condition = { _id: '507f1f77bcf86cd799439011' };
      const updateData: DataType = { name: 'Updated Name' };
      model.updateOne = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await repository.updateOneBy(
        condition as FilterQuery<TestDocument>,
        updateData,
      );

      expect(result).toBe(false);
    });
  });

  describe('findManyBy', () => {
    it('should find multiple documents by condition', async () => {
      const condition = { isActive: true };
      const documents = [
        mockDocumentData,
        { ...mockDocumentData, _id: 'another-id' },
      ];
      const chainableMock = createChainableMock();

      // Mock find to return array of documents with toObject method
      model.find = jest.fn().mockReturnValue({
        ...chainableMock,
        map: jest.fn().mockImplementation((fn) => documents.map(fn)),
      });

      jest.spyOn(repository, 'findManyBy').mockResolvedValue(documents as any);

      const result = await repository.findManyBy(
        condition as FilterQuery<TestDocument>,
      );

      expect(result).toEqual(documents);
    });

    it('should return empty array on error', async () => {
      const condition = { isActive: true };
      model.find = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await repository.findManyBy(
        condition as FilterQuery<TestDocument>,
      );

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should find all documents', async () => {
      const documents = [mockDocumentData];
      jest.spyOn(repository, 'findManyBy').mockResolvedValue(documents as any);

      const result = await repository.findAll();

      expect(repository.findManyBy).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqual(documents);
    });

    it('should find all documents with params', async () => {
      const params: AdditionalParams = { populate: ['author'] };
      const documents = [mockDocumentData];
      jest.spyOn(repository, 'findManyBy').mockResolvedValue(documents as any);

      const result = await repository.findAll(params);

      expect(repository.findManyBy).toHaveBeenCalledWith({}, params);
      expect(result).toEqual(documents);
    });
  });

  describe('pushArray', () => {
    it('should push to array successfully', async () => {
      const condition = { _id: '507f1f77bcf86cd799439011' };
      const data: DataType = { tags: 'new-tag' };
      model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      const result = await repository.pushArray(
        condition as FilterQuery<TestDocument>,
        data,
      );

      expect(model.updateOne).toHaveBeenCalledWith(condition, {
        $push: data,
        $inc: { __v: 1 },
      });
      expect(result).toBe(true);
    });

    it('should return false when no document modified', async () => {
      const condition = { _id: 'nonexistent' };
      const data: DataType = { tags: 'new-tag' };
      model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 0 });

      const result = await repository.pushArray(
        condition as FilterQuery<TestDocument>,
        data,
      );

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const condition = { _id: '507f1f77bcf86cd799439011' };
      const data: DataType = { tags: 'new-tag' };
      model.updateOne = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await repository.pushArray(
        condition as FilterQuery<TestDocument>,
        data,
      );

      expect(result).toBe(false);
    });
  });

  describe('pullArray', () => {
    it('should pull from array successfully', async () => {
      const condition = { _id: '507f1f77bcf86cd799439011' };
      const data: DataType = { tags: 'old-tag' };
      model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      const result = await repository.pullArray(
        condition as FilterQuery<TestDocument>,
        data,
      );

      expect(model.updateOne).toHaveBeenCalledWith(condition, {
        $pull: data,
        $inc: { __v: 1 },
      });
      expect(result).toBe(true);
    });

    it('should return false when no document modified', async () => {
      const condition = { _id: 'nonexistent' };
      const data: DataType = { tags: 'old-tag' };
      model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 0 });

      const result = await repository.pullArray(
        condition as FilterQuery<TestDocument>,
        data,
      );

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const condition = { _id: '507f1f77bcf86cd799439011' };
      const data: DataType = { tags: 'old-tag' };
      model.updateOne = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await repository.pullArray(
        condition as FilterQuery<TestDocument>,
        data,
      );

      expect(result).toBe(false);
    });
  });
});
