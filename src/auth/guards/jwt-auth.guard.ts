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
    // This part remains the same.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public routes, we still want to run the JWT strategy
      // to potentially attach a user to the request if a token is provided.
      // So, we call super.canActivate but will handle errors differently.
      return super.canActivate(context);
    }

    // For protected routes, the default behavior is correct.
    return super.canActivate(context);
  }

  handleRequest<TUser = User>(
    err: any,
    user: TUser,
    info: Error,
    context: ExecutionContext, // --- V NEW: Added context parameter ---
  ): TUser {
    // Check for specific error types by their name property.
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired.');
    }
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('Invalid token.');
    }

    // --- V NEW: Check if the route is public ---
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the route is public and there's no user, we don't throw an error.
    // We just return null (or undefined), and the request continues.
    if (isPublic && (err || !user)) {
      return null as TUser; // Let the request proceed without a user object.
    }
    // --- ^ END of NEW ---

    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed.');
    }

    return user;
  }
}
