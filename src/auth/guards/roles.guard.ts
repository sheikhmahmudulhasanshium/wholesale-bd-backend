import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { UserDocument } from '../../users/schemas/user.schema';
import { ROLES_KEY } from '../decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: UserDocument }>();

    // If there's no user object, deny access immediately.
    if (!user) {
      return false;
    }

    // FIX: Cast user.role to the Role enum type for safe comparison.
    // This satisfies the `no-unsafe-enum-comparison` rule.
    return requiredRoles.some((role) => (user.role as Role) === role);
  }
}
