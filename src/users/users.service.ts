import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  // --- ADD THIS NEW METHOD ---
  /**
   * Counts all users in the database.
   * @returns A promise that resolves to the total number of users.
   */
  async countAll(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }
}
