import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Make ConfigService available
  providers: [MailService],
  exports: [MailService], // Export MailService
})
export class MailModule {}
