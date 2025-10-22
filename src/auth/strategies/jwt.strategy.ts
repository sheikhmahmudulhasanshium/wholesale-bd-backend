import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // FIX: Added the non-null assertion operator (!) to assert that the value exists.
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.userService.findById(payload.userId);
    if (!user || !user.isActive || !user.emailVerified) {
      throw new UnauthorizedException(
        'Access Denied: Invalid user or unverified account.',
      );
    }
    // You might want to strip sensitive fields from the user object here before returning
    // Or just return the user as is, depending on your needs.
    return user;
  }
}
