import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Role } from '../../auth/enums/role.enum';

@Injectable()
export class UsersSeedService {
  private readonly logger = new Logger(UsersSeedService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async seed() {
    const existingUsers = await this.userModel.countDocuments();
    if (existingUsers > 0) {
      this.logger.log('Users already seeded. Skipping.');
      return;
    }

    const hashedPassword = await bcrypt.hash('Password123!', 12);
    const users = [
      // Admin
      {
        email: 'admin@wholesale.com',
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        emailVerified: true,
      },
      // Seller
      {
        email: 'seller@wholesale.com',
        firstName: 'Seller',
        lastName: 'One',
        role: Role.SELLER,
        sellerStatus: 'approved',
        businessName: 'Seller One Inc.',
        emailVerified: true,
      },
      // Customer
      {
        email: 'customer@wholesale.com',
        firstName: 'Customer',
        lastName: 'One',
        role: Role.CUSTOMER,
        emailVerified: true,
      },
    ];

    const usersToCreate = users.map((user) => ({
      ...user,
      password: hashedPassword,
    }));

    await this.userModel.insertMany(usersToCreate);
    this.logger.log(`${users.length} users seeded successfully.`);
  }
}
