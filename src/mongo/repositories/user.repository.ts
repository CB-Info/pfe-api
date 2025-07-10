import { Injectable } from '@nestjs/common';
import BaseRepository from './base.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../models/user.model';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectModel(User.name) private model: Model<User>) {
    super(model);
  }

  // Method to find user with firebaseId included (since it has select: false by default)
  async findOneByIdWithFirebaseId(userId: string): Promise<User | null> {
    try {
      const user = await this.Model.findById(userId)
        .select('+firebaseId') // Include the firebaseId field
        .lean(); // Convert to plain object

      return user as User;
    } catch (e) {
      console.log('Error finding user with firebaseId:', e);
      return null;
    }
  }

  // Alternative method to find by any condition with firebaseId
  async findOneWithFirebaseId(condition: any): Promise<User | null> {
    try {
      const user = await this.Model.findOne(condition)
        .select('+firebaseId') // Include the firebaseId field
        .lean(); // Convert to plain object

      return user as User;
    } catch (e) {
      console.log('Error finding user with firebaseId:', e);
      return null;
    }
  }
}
