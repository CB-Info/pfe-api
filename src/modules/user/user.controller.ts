import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseTokenGuard } from 'src/guards/firebase-token.guard';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserDTO } from 'src/dto/user.dto';
import { UserUpdateDTO } from 'src/dto/user.update.dto';
import { UserRole } from 'src/mongo/models/user.model';

@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: UserDTO,
  })
  @ApiBody({ type: UserDTO })
  async createUser(@Body() body: UserDTO) {
    const response = await this.userService.registerUser(body);

    return { error: '', data: response };
  }

  @Get('me')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'The current user information.',
    type: UserDTO,
  })
  async getMe(@Req() request) {
    const response = request.user;

    return { error: '', data: response };
  }

  @Get('')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users (Management only: Admin/Owner/Manager)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users.',
  })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  async getAllUsers(@Req() request, @Query('role') role?: UserRole) {
    // Check if user has permission to manage users
    if (!this.userService.canManageUsers(request.user.role)) {
      return {
        error: 'Insufficient permissions. Only management can view all users.',
        data: null,
      };
    }

    const response = role
      ? await this.userService.getUsersByRole(role)
      : await this.userService.getAllUsers();

    return { error: '', data: response };
  }

  @Get(':userId')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User information.',
  })
  @ApiParam({ name: 'userId', description: 'The ID of the user to get' })
  async getUserById(@Req() request, @Param('userId') userId: string) {
    // Users can view their own profile or management can view any profile
    if (
      request.user._id !== userId &&
      !this.userService.canManageUsers(request.user.role)
    ) {
      return {
        error: 'Insufficient permissions. You can only view your own profile.',
        data: null,
      };
    }

    const response = await this.userService.getUserById(userId);
    return { error: '', data: response };
  }

  @Patch(':userId')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: UserUpdateDTO,
  })
  @ApiBody({ type: UserUpdateDTO })
  @ApiParam({ name: 'userId', description: 'The ID of the user to update' })
  async updateUser(
    @Body() body: UserUpdateDTO,
    @Param('userId') userId: string,
    @Req() request,
  ) {
    // Users can update their own profile or management can update any profile
    if (
      request.user._id !== userId &&
      !this.userService.canManageUsers(request.user.role)
    ) {
      return {
        error:
          'Insufficient permissions. You can only update your own profile.',
        data: null,
      };
    }

    const response = await this.userService.updateUser(userId, body);
    return { error: '', data: response };
  }

  @Put(':userId/role')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user role',
    description:
      'Change user role based on hierarchy: Admin can assign any role, Owner can assign any role except Admin, Manager can assign roles below Owner level. Users cannot change their own role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User role has been successfully updated.',
  })
  @ApiParam({ name: 'userId', description: 'The ID of the user to update' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: Object.values(UserRole) },
      },
    },
  })
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: { role: UserRole },
    @Req() request,
  ) {
    const response = await this.userService.updateUserRole(
      userId,
      body.role,
      request.user.role,
      request.user._id,
    );
    return { error: '', data: response };
  }

  @Delete(':userId')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user permanently (Admin only)',
    description:
      'Permanently removes user from both MongoDB and Firebase Auth. Only admins can perform this action.',
  })
  @ApiResponse({
    status: 200,
    description:
      'User has been successfully deleted from both MongoDB and Firebase.',
  })
  @ApiParam({ name: 'userId', description: 'The ID of the user to delete' })
  async deleteUser(@Param('userId') userId: string, @Req() request) {
    const result = await this.userService.deleteUser(userId, request.user.role);
    return {
      error: '',
      data: {
        deleted: result,
        message:
          'User successfully deleted from both Firebase Auth and MongoDB',
      },
    };
  }

  @Put(':userId/deactivate')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate user (Management only)',
    description:
      'Soft delete - deactivates user account in both MongoDB and Firebase Auth without removing data. User will not be able to authenticate. Can be performed by Admin, Owner, or Manager.',
  })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully deactivated.',
  })
  @ApiParam({ name: 'userId', description: 'The ID of the user to deactivate' })
  async deactivateUser(@Param('userId') userId: string, @Req() request) {
    // Check permissions using the service method
    if (!this.userService.canManageUsers(request.user.role)) {
      return {
        error:
          'Insufficient permissions. Only management can deactivate users.',
        data: null,
      };
    }

    const response = await this.userService.deactivateUser(userId);
    return { error: '', data: response };
  }

  @Put(':userId/activate')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate user (Management only)',
    description:
      'Reactivates a previously deactivated user account in both MongoDB and Firebase Auth. User will be able to authenticate again. Can be performed by Admin, Owner, or Manager.',
  })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully activated.',
  })
  @ApiParam({ name: 'userId', description: 'The ID of the user to activate' })
  async activateUser(@Param('userId') userId: string, @Req() request) {
    // Check permissions using the service method
    if (!this.userService.canManageUsers(request.user.role)) {
      return {
        error: 'Insufficient permissions. Only management can activate users.',
        data: null,
      };
    }

    const response = await this.userService.activateUser(userId);
    return { error: '', data: response };
  }

  @Get('permissions/check')
  @UseGuards(FirebaseTokenGuard)
  @ApiSecurity('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check user permissions',
    description:
      'Returns the permissions available to the current user based on their role in the restaurant hierarchy.',
  })
  @ApiResponse({
    status: 200,
    description: 'User permissions based on role hierarchy.',
  })
  async checkPermissions(@Req() request) {
    const userRole = request.user.role;

    const permissions = {
      // Basic user info
      role: userRole,

      // User management permissions
      canManageUsers: this.userService.canManageUsers(userRole),
      canChangeRoles: this.userService.canChangeRoles(userRole),
      canDeleteUsers: this.userService.canDeleteUsers(userRole),
      canCreateOwners: this.userService.canCreateOwners(userRole),

      // Restaurant operations permissions
      canManageOrders: this.userService.canManageOrders(userRole),
      canTakeOrders: this.userService.canTakeOrders(userRole),
      canPrepareOrders: this.userService.canPrepareOrders(userRole),
      canSuperviseRestaurant: this.userService.canSuperviseRestaurant(userRole),

      // Role hierarchy description
      roleDescription: this.getRoleDescription(userRole),
    };

    return { error: '', data: permissions };
  }

  private getRoleDescription(role: UserRole): string {
    const descriptions = {
      [UserRole.CUSTOMER]: 'Can place orders and make payments',
      [UserRole.WAITER]:
        'Can take orders, send to kitchen, and receive order ready notifications',
      [UserRole.KITCHEN_STAFF]:
        'Can receive orders, prepare them, and mark them as ready',
      [UserRole.MANAGER]:
        'Can change user roles (except admin/owner), activate/deactivate users, and manage restaurant operations',
      [UserRole.OWNER]:
        'Can supervise entire restaurant, add/remove users, change roles (except admin and own role), plus all manager rights',
      [UserRole.ADMIN]:
        'Full access to all features including creating owner accounts and permanent user deletion',
    };

    return descriptions[role] || 'Unknown role';
  }
}
