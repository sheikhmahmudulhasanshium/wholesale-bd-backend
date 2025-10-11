import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// We no longer need to import Request from 'express', avoiding the conflict.

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // FIXED: We explicitly define the type of 'request' with the 'headers' property we need.
    const request: { headers: { [key: string]: string } } = context
      .switchToHttp()
      .getRequest();

    const apiKey = request.headers['x-api-key'];

    const validApiKey = this.configService.getOrThrow<string>('API_KEY');

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid or missing API Key');
    }

    return true;
  }
}
