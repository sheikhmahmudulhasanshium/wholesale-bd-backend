import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
<<<<<<< HEAD
import { User, UserSchema } from './schemas/user.schema';
import { CommonModule } from '../common/common.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CommonModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
=======
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { ConfigModule } from '@nestjs/config'; // <-- 1. IMPORT THIS

@Module({
  imports: [
    ConfigModule, // <-- 2. ADD THIS
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
>>>>>>> main
})
export class UsersModule {}
