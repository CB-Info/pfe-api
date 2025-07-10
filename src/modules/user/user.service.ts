import { BadRequestException, Injectable, ForbiddenException } from '@nestjs/common';
import { UserRepository } from 'src/mongo/repositories/user.repository';
import { UserDTO } from 'src/dto/user.dto';
import { User, UserRole } from 'src/mongo/models/user.model';
import config from 'src/configs/config';
import firebase from 'src/configs/firebase.config';
import axios from 'axios';
import { UserUpdateDTO } from 'src/dto/user.update.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  updateUser = async (
    userId: string,
    parameters: UserUpdateDTO,
  ): Promise<User> => {
    // @ts-expect-error parameters is a DataType
    const updated = await this.userRepository.updateOneBy({ _id: userId }, parameters);
    
    if (!updated) {
      throw new BadRequestException('Failed to update user');
    }
    
    return this.userRepository.findOneById(userId);
  };

  registerUser = async (parameters: UserDTO): Promise<User> => {
    try {
      const { email, password, firstname, lastname, role, phoneNumber } = parameters;
      const data = JSON.stringify({ email, password, returnSecureToken: true });

      const result = await axios({
        method: 'post',
        url: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config().apiKey}`,
        headers: { 'Content-Type': 'application/json' },
        data: data,
      });

      const { localId: firebaseId } = result.data;

      const savedUser = await this.userRepository.insert({
        email: email,
        firstname: firstname,
        lastname: lastname,
        firebaseId: firebaseId,
        role: role || UserRole.CUSTOMER,
        phoneNumber: phoneNumber,
        isActive: true,
      });

      return await this.userRepository.findOneById(savedUser._id.toString());
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  };

  // Get all users (for admin/owner/manager)
  getAllUsers = async (): Promise<User[]> => {
    return this.userRepository.findAll();
  };

  // Get users by role
  getUsersByRole = async (role: UserRole): Promise<User[]> => {
    return this.userRepository.findManyBy({ role });
  };

  // Enhanced role permission checking methods
  
  // Check if user can manage other users (view, edit, deactivate)
  canManageUsers = (userRole: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER].includes(userRole);
  };

  // Check if user can change roles
  canChangeRoles = (userRole: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER].includes(userRole);
  };

  // Check if user can delete users (only admin)
  canDeleteUsers = (userRole: UserRole): boolean => {
    return userRole === UserRole.ADMIN;
  };

  // Check if user can create owner accounts (only admin)
  canCreateOwners = (userRole: UserRole): boolean => {
    return userRole === UserRole.ADMIN;
  };

  // Check if user can work with orders
  canManageOrders = (userRole: UserRole): boolean => {
    return [UserRole.CUSTOMER, UserRole.WAITER, UserRole.KITCHEN_STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN].includes(userRole);
  };

  // Check if user can take orders (waiter and above)
  canTakeOrders = (userRole: UserRole): boolean => {
    return [UserRole.WAITER, UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN].includes(userRole);
  };

  // Check if user can prepare orders (kitchen staff and above)
  canPrepareOrders = (userRole: UserRole): boolean => {
    return [UserRole.KITCHEN_STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN].includes(userRole);
  };

  // Check if user can view all restaurant data (owner and admin)
  canSuperviseRestaurant = (userRole: UserRole): boolean => {
    return [UserRole.OWNER, UserRole.ADMIN].includes(userRole);
  };

  // Enhanced role validation for role changes
  validateRoleChange = (
    requestingUserRole: UserRole,
    targetRole: UserRole,
    isOwnRole: boolean = false
  ): void => {
    // Users cannot change their own role to higher levels
    if (isOwnRole) {
      throw new ForbiddenException('Users cannot change their own role');
    }

    // Only admins can assign admin roles
    if (targetRole === UserRole.ADMIN && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can assign admin roles');
    }

    // Only admins can create owner accounts
    if (targetRole === UserRole.OWNER && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can assign owner roles');
    }

    // Only admins and owners can assign manager roles
    if (targetRole === UserRole.MANAGER && 
        ![UserRole.ADMIN, UserRole.OWNER].includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins or owners can assign manager roles');
    }

    // Only management can change roles
    if (!this.canChangeRoles(requestingUserRole)) {
      throw new ForbiddenException('Insufficient permissions to change user roles');
    }
  };

  // Update user role with enhanced validation
  updateUserRole = async (
    userId: string,
    newRole: UserRole,
    requestingUserRole: UserRole,
    requestingUserId?: string,
  ): Promise<User> => {
    // Check if user is trying to change their own role
    const isOwnRole = requestingUserId === userId;
    
    // Validate the role change
    this.validateRoleChange(requestingUserRole, newRole, isOwnRole);

    const updated = await this.userRepository.updateOneBy(
      { _id: userId },
      { role: newRole }
    );

    if (!updated) {
      throw new BadRequestException('Failed to update user role');
    }

    return this.userRepository.findOneById(userId);
  };

  // Enhanced delete user from both MongoDB and Firebase Auth
  deleteUser = async (
    userId: string,
    requestingUserRole: UserRole,
  ): Promise<boolean> => {
    // Only admins can delete users permanently
    if (!this.canDeleteUsers(requestingUserRole)) {
      throw new ForbiddenException('Only admins can delete users');
    }

    try {
      // First, get the user with firebaseId explicitly selected (since it has select: false in model)
      const user = await this.userRepository.findOneByIdWithFirebaseId(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      console.log(`Attempting to delete user. MongoDB ID: ${userId}, Firebase ID: ${user.firebaseId}`);

      // Validate Firebase ID before attempting deletion
      if (user.firebaseId && typeof user.firebaseId === 'string' && user.firebaseId.trim().length > 0 && user.firebaseId.length <= 128) {
        try {
          await firebase.auth().deleteUser(user.firebaseId);
          console.log(`Successfully deleted user ${user.firebaseId} from Firebase Auth`);
        } catch (firebaseError) {
          console.log('Firebase deletion error:', firebaseError);
          // Continue with MongoDB deletion even if Firebase fails
          // This handles cases where Firebase user might already be deleted or is invalid
        }
      } else {
        console.log(`Invalid or missing Firebase ID for user ${userId}:`, user.firebaseId);
        console.log('Skipping Firebase deletion due to invalid Firebase ID, but continuing with MongoDB deletion');
      }

      // Delete from MongoDB (handles user data and permissions)
      const deleted = await this.userRepository.deleteOneBy({ _id: userId });
      
      if (!deleted) {
        throw new BadRequestException('Failed to delete user from database');
      }

      console.log(`Successfully deleted user ${userId} from MongoDB${user.firebaseId ? ' and Firebase Auth' : ' (Firebase ID was invalid)'}`);
      return true;
    } catch (e) {
      console.log('Delete user error:', e);
      if (e instanceof ForbiddenException || e instanceof BadRequestException) {
        throw e;
      }
      throw new BadRequestException('Failed to delete user');
    }
  };

  // Deactivate user (soft delete) - only management can do this
  deactivateUser = async (userId: string): Promise<User> => {
    try {
      // First, get the user with firebaseId explicitly selected
      const user = await this.userRepository.findOneByIdWithFirebaseId(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      console.log(`Attempting to deactivate user. MongoDB ID: ${userId}, Firebase ID: ${user.firebaseId}`);

      // Deactivate in Firebase Auth if Firebase ID is valid
      if (user.firebaseId && typeof user.firebaseId === 'string' && user.firebaseId.trim().length > 0 && user.firebaseId.length <= 128) {
        try {
          await firebase.auth().updateUser(user.firebaseId, { disabled: true });
          console.log(`Successfully deactivated user ${user.firebaseId} in Firebase Auth`);
        } catch (firebaseError) {
          console.log('Firebase deactivation error:', firebaseError);
          // Continue with MongoDB deactivation even if Firebase fails
        }
      } else {
        console.log(`Invalid or missing Firebase ID for user ${userId}:`, user.firebaseId);
        console.log('Skipping Firebase deactivation due to invalid Firebase ID, but continuing with MongoDB deactivation');
      }

      // Deactivate in MongoDB
      const updated = await this.userRepository.updateOneBy(
        { _id: userId },
        { isActive: false }
      );

      if (!updated) {
        throw new BadRequestException('Failed to deactivate user in database');
      }

      console.log(`Successfully deactivated user ${userId} in MongoDB${user.firebaseId ? ' and Firebase Auth' : ' (Firebase ID was invalid)'}`);
      return this.userRepository.findOneById(userId);
    } catch (e) {
      console.log('Deactivate user error:', e);
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new BadRequestException('Failed to deactivate user');
    }
  };

  // Activate user - only management can do this
  activateUser = async (userId: string): Promise<User> => {
    try {
      // First, get the user with firebaseId explicitly selected
      const user = await this.userRepository.findOneByIdWithFirebaseId(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      console.log(`Attempting to activate user. MongoDB ID: ${userId}, Firebase ID: ${user.firebaseId}`);

      // Activate in Firebase Auth if Firebase ID is valid
      if (user.firebaseId && typeof user.firebaseId === 'string' && user.firebaseId.trim().length > 0 && user.firebaseId.length <= 128) {
        try {
          await firebase.auth().updateUser(user.firebaseId, { disabled: false });
          console.log(`Successfully activated user ${user.firebaseId} in Firebase Auth`);
        } catch (firebaseError) {
          console.log('Firebase activation error:', firebaseError);
          // Continue with MongoDB activation even if Firebase fails
        }
      } else {
        console.log(`Invalid or missing Firebase ID for user ${userId}:`, user.firebaseId);
        console.log('Skipping Firebase activation due to invalid Firebase ID, but continuing with MongoDB activation');
      }

      // Activate in MongoDB
      const updated = await this.userRepository.updateOneBy(
        { _id: userId },
        { isActive: true }
      );

      if (!updated) {
        throw new BadRequestException('Failed to activate user in database');
      }

      console.log(`Successfully activated user ${userId} in MongoDB${user.firebaseId ? ' and Firebase Auth' : ' (Firebase ID was invalid)'}`);
      return this.userRepository.findOneById(userId);
    } catch (e) {
      console.log('Activate user error:', e);
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new BadRequestException('Failed to activate user');
    }
  };

  // Get user by ID
  getUserById = async (userId: string): Promise<User> => {
    return this.userRepository.findOneById(userId);
  };

  // Legacy methods (kept for backward compatibility)
  isAdmin = (userRole: UserRole): boolean => {
    return userRole === UserRole.ADMIN;
  };

  isManagement = (userRole: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER].includes(userRole);
  };
}
