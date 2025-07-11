import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import DateBeautifier from '../../utils/date.beautifier';

export enum UserRole {
  CUSTOMER = 'customer',
  WAITER = 'waiter',
  KITCHEN_STAFF = 'kitchen_staff',
  MANAGER = 'manager',
  OWNER = 'owner',
  ADMIN = 'admin',
}

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ select: false, required: true })
  firebaseId: string;

  @Prop({ required: true, trim: true })
  firstname: string;

  @Prop({ required: true, trim: true })
  lastname: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    required: true,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Prop({ required: false, trim: true })
  phoneNumber?: string;

  @Prop({ required: false, default: true })
  isActive: boolean;

  @Prop({
    type: String,
    required: true,
    default: DateBeautifier.shared.getFullDate(),
  })
  dateOfCreation: string;

  @Prop({ type: String, required: false })
  dateLastModified?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('updateOne', function (next) {
  this.set({ dateLastModified: DateBeautifier.shared.getFullDate() });
  next();
});

UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ dateLastModified: DateBeautifier.shared.getFullDate() });
  next();
});
