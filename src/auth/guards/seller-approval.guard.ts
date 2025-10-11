import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class SellerApprovalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: UserDocument }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    // This guard only applies to users with the SELLER role. Admins and Customers pass through.
    // FIX: Cast `user.role` to the `Role` enum for safe comparison.
    if ((user.role as Role) !== Role.SELLER) {
      return true;
    }

    // If the user is a seller, check if their status is 'approved'.
    if (user.sellerStatus !== 'approved') {
      throw new ForbiddenException('Your seller account is not yet approved.');
    }

    return true;
  }
}
