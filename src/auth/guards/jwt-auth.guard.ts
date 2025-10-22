// src/auth/guards/jwt-auth.guard.ts
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/schemas/user.schema';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  // --- vvvvvvv THIS IS THE CORRECTED SECTION vvvvvvv ---

  handleRequest<TUser = User>(
    err: any,
    user: TUser,
    // FIXED: Type 'info' as a generic Error, which is globally available.
    // This allows safe access to the 'name' property without causing lint errors.
    info: Error,
  ): TUser {
    // Check for specific error types by their name property.
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired.');
    }
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('Invalid token.');
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed.');
    }

    return user;
  }
  // --- ^^^^^^^ THIS IS THE CORRECTED SECTION ^^^^^^^ ---
}
