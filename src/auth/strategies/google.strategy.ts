// FIX: Add UnauthorizedException for better error handling.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// FIX: Remove VerifyCallback as it's not needed in the modern pattern.
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UserRole, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId')!,
      clientSecret: configService.get<string>('google.clientSecret')!,
      callbackURL: configService.get<string>('google.callbackUrl')!,
      scope: ['email', 'profile'],
    });
  }

  // FIX: Refactor to the modern async/return/throw pattern.
  // This is cleaner and resolves all ESLint type inference issues.
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<UserDocument> {
    // The method now directly returns the UserDocument.
    const { name, emails, photos } = profile;

    if (!emails || emails.length === 0) {
      // On failure, throw an exception. Passport will catch it and respond with a 401.
      throw new UnauthorizedException('No email found in Google profile');
    }

    const userPayload = {
      email: emails[0].value,
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      profilePicture: photos?.[0].value,
      googleId: profile.id,
      authProviders: ['google'],
      emailVerified: true,
      role: UserRole.CUSTOMER,
    };

    // The authService can also throw errors (e.g., ConflictException), which will be caught by Passport.
    const user = await this.authService.validateOAuthUser(userPayload);

    // On success, return the user. Passport will attach this to `req.user`.
    return user;
  }
}
