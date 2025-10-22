import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/schemas/user.schema';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User>(err: any, user: TUser): TUser {
    // If passport gives an error, or if the user is not found,
    // we always throw a clear, consistent UnauthorizedException.
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    // If everything is fine, return the user.
    return user;
  }
}
