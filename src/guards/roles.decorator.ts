import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../mongo/models/user.model';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);