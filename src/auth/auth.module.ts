import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from '../users/schemas/user.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

/**
 * A simple, self-contained utility to parse a time string (e.g., "1d", "7h", "30m")
 * into seconds, which is a valid type for JWT's `expiresIn` option.
 * This avoids adding new dependencies and satisfies strict type checking.
 * @param timeString The time string to parse.
 * @returns The number of seconds.
 */
function parseTimeStringToSeconds(timeString: string): number {
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Default to 1 day in seconds if format is invalid
    return 86400;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 86400;
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    CommonModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        // Get the time string (e.g., "1d") from environment variables.
        const expiresInString =
          configService.get<string>('JWT_EXPIRES_IN') || '1d';

        // Use our utility to convert the string to a number of seconds.
        const expiresInSeconds = parseTimeStringToSeconds(expiresInString);

        // Construct the options. `expiresInSeconds` is a `number`, which is a valid and safe type.
        const options: JwtModuleOptions = {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresInSeconds,
          },
        };

        return options;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
