import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import {
  User,
  UserDocument,
  UserRole,
  KycStatus,
  SellerStatus,
} from '../users/schemas/user.schema';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { Zone, ZoneDocument } from '../zones/schemas/zone.schema';
import {
  Product,
  ProductDocument,
  ProductStatus,
  ProductUnit,
} from '../products/schemas/product.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from '../orders/schemas/order.schema';
import { SeedDto, SeedEntity } from './dto/seed.dto';
import { CleanDto } from './dto/clean.dto';

const getRandomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const firstNames = [
  'John',
  'Jane',
  'Peter',
  'Mary',
  'David',
  'Sarah',
  'Mike',
  'Emily',
  'Chris',
  'Laura',
];
const lastNames = [
  'Smith',
  'Doe',
  'Jones',
  'Williams',
  'Brown',
  'Davis',
  'Miller',
  'Wilson',
  'Moore',
];
const productNouns = [
  'T-Shirt',
  'Mug',
  'Laptop',
  'Keyboard',
  'Chair',
  'Desk',
  'Lamp',
  'Bottle',
  'Headphones',
  'Mouse',
];
const productAdjectives = [
  'Premium',
  'Durable',
  'Ergonomic',
  'High-Quality',
  'Eco-friendly',
  'Smart',
  'Wireless',
  'Compact',
];
const companySuffixes = ['Inc.', 'Ltd.', 'Corp.', 'Solutions', 'Group'];
const cities = [
  'Dhaka',
  'Chittagong',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Rangpur',
];

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Zone.name) private zoneModel: Model<ZoneDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async setupInitialAdmin(): Promise<string> {
    const adminExists = await this.userModel
      .findOne({ role: UserRole.ADMIN })
      .exec();
    if (adminExists) {
      this.logger.log('Admin user already exists. Skipping setup.');
      return 'An admin user already exists. No action was taken.';
    }

    this.logger.log('No admin user found. Creating default admin...');
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('Admin@1234', salt);

    const adminUser = new this.userModel({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@wholesalebd.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
      kycStatus: KycStatus.APPROVED,
      sellerStatus: SellerStatus.APPROVED,
      isSampleData: false, // Default admin is NOT sample data
    });

    await adminUser.save();
    return 'Success: Default admin user created (admin@wholesalebd.com / Admin@1234).';
  }

  async seed(seedDto: SeedDto): Promise<string> {
    this.logger.log(
      `Received request to seed '${seedDto.quantity}' of '${seedDto.entity}'...`,
    );
    switch (seedDto.entity) {
      case SeedEntity.USERS:
        return this.seedUsers(seedDto.quantity);
      case SeedEntity.ZONES:
        return this.seedZones(seedDto.quantity);
      case SeedEntity.CATEGORIES:
        return this.seedCategories(seedDto.quantity);
      case SeedEntity.PRODUCTS:
        return this.seedProducts(seedDto.quantity);
      case SeedEntity.ORDERS:
        return this.seedOrders(seedDto.quantity);
      default:
        throw new BadRequestException('Invalid entity type for seeding.');
    }
  }

  async clean(cleanDto: CleanDto): Promise<{ message: string; count: number }> {
    this.logger.warn(
      `Received request to CLEAN sample data for '${cleanDto.entity}'...`,
    );
    let deletedCount = 0;
    switch (cleanDto.entity) {
      case SeedEntity.USERS:
        deletedCount = (await this.userModel.deleteMany({ isSampleData: true }))
          .deletedCount;
        break;
      case SeedEntity.ZONES:
        deletedCount = (await this.zoneModel.deleteMany({ isSampleData: true }))
          .deletedCount;
        break;
      case SeedEntity.CATEGORIES:
        deletedCount = (
          await this.categoryModel.deleteMany({ isSampleData: true })
        ).deletedCount;
        break;
      case SeedEntity.PRODUCTS:
        deletedCount = (
          await this.productModel.deleteMany({ isSampleData: true })
        ).deletedCount;
        break;
      case SeedEntity.ORDERS:
        deletedCount = (
          await this.orderModel.deleteMany({ isSampleData: true })
        ).deletedCount;
        break;
      default:
        throw new BadRequestException('Invalid entity type for cleaning.');
    }
    const message = `Success: Deleted ${deletedCount} sample ${cleanDto.entity}.`;
    this.logger.log(message);
    return { message, count: deletedCount };
  }

  async seedUsers(quantity: number): Promise<string> {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('Password@123', salt);
    const usersToCreate: Partial<User>[] = [];

    // Explicitly define the roles that are safe to seed randomly.
    // ADMIN is intentionally excluded for security.
    const seedableRoles = [UserRole.SELLER, UserRole.CUSTOMER];

    for (let i = 0; i < quantity; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const userRole = getRandomElement(seedableRoles); // Only pick from safe roles

      usersToCreate.push({
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now() + i}@example.com`,
        password: hashedPassword,
        role: userRole,
        emailVerified: true,
        isActive: true,
        kycStatus:
          userRole === UserRole.SELLER
            ? getRandomElement(Object.values(KycStatus))
            : KycStatus.NOT_STARTED,
        sellerStatus:
          userRole === UserRole.SELLER
            ? getRandomElement(Object.values(SellerStatus))
            : SellerStatus.PENDING,
        businessName:
          userRole === UserRole.SELLER
            ? `${getRandomElement(productAdjectives)} ${getRandomElement(productNouns)} ${getRandomElement(companySuffixes)}`
            : undefined,
        isSampleData: true,
      });
    }
    await this.userModel.insertMany(usersToCreate);
    return `Success: Created ${usersToCreate.length} new users (Sellers/Customers only).`;
  }

  async seedZones(quantity: number): Promise<string> {
    const zonesToCreate: Partial<Zone>[] = [];
    for (let i = 0; i < quantity; i++) {
      const name = `${getRandomElement(cities)} Region ${Date.now() + i}`;
      zonesToCreate.push({
        name,
        code: name.substring(0, 3).toUpperCase() + i,
        sortOrder: i,
        isSampleData: true,
      });
    }
    await this.zoneModel.insertMany(zonesToCreate);
    return `Success: Created ${zonesToCreate.length} new zones.`;
  }

  async seedCategories(quantity: number): Promise<string> {
    const categoriesToCreate: Partial<Category>[] = [];
    for (let i = 0; i < quantity; i++) {
      const name = `${getRandomElement(productAdjectives)} ${getRandomElement(productNouns)} Category ${i}`;
      categoriesToCreate.push({
        name,
        description: `A category for ${name}`,
        sortOrder: i,
        isSampleData: true,
      });
    }
    await this.categoryModel.insertMany(categoriesToCreate);
    return `Success: Created ${categoriesToCreate.length} new categories.`;
  }

  async seedProducts(quantity: number): Promise<string> {
    const [sellers, categories, zones] = await Promise.all([
      this.userModel
        .find({ role: UserRole.SELLER, sellerStatus: SellerStatus.APPROVED })
        .exec(),
      this.categoryModel.find().exec(),
      this.zoneModel.find().exec(),
    ]);
    if (sellers.length === 0)
      return 'Failed: No approved sellers found. Please seed users first.';
    if (categories.length === 0)
      return 'Failed: No categories found. Please seed categories first.';
    if (zones.length === 0)
      return 'Failed: No zones found. Please seed zones first.';
    const productsToCreate: Partial<Product>[] = [];
    for (let i = 0; i < quantity; i++) {
      const basePrice = getRandomNumber(100, 5000);
      const name = `${getRandomElement(productAdjectives)} ${getRandomElement(productNouns)} #${Date.now() + i}`;
      productsToCreate.push({
        name,
        description: `A high-quality ${name} suitable for all your needs.`,
        sellerId: getRandomElement(sellers)._id.toString(),
        categoryId: getRandomElement(categories)._id.toString(),
        zoneId: getRandomElement(zones)._id.toString(),
        status: ProductStatus.ACTIVE,
        unit: ProductUnit.PIECE,
        stockQuantity: getRandomNumber(100, 1000),
        minimumOrderQuantity: getRandomElement([10, 20, 50]),
        pricingTiers: [
          {
            minQuantity: 10,
            pricePerUnit: parseFloat((basePrice * 0.9).toFixed(2)),
          },
          {
            minQuantity: 50,
            pricePerUnit: parseFloat((basePrice * 0.8).toFixed(2)),
          },
          {
            minQuantity: 100,
            pricePerUnit: parseFloat((basePrice * 0.7).toFixed(2)),
          },
        ],
        brand: 'BrandCorp',
        images: [
          `https://picsum.photos/seed/${name.replace(/\s/g, '')}/600/400`,
        ],
        isSampleData: true,
      });
    }
    await this.productModel.insertMany(productsToCreate);
    return `Success: Created ${productsToCreate.length} new products.`;
  }

  async seedOrders(quantity: number): Promise<string> {
    const [customers, products] = await Promise.all([
      this.userModel.find({ role: UserRole.CUSTOMER }).exec(),
      this.productModel.find({ status: ProductStatus.ACTIVE }).exec(),
    ]);
    if (customers.length === 0)
      return 'Failed: No customers found to create orders for.';
    if (products.length === 0)
      return 'Failed: No active products found to create orders with.';
    const ordersToCreate: Partial<Order>[] = [];
    for (let i = 0; i < quantity; i++) {
      const orderedProduct = getRandomElement(products);
      const orderQuantity = getRandomNumber(
        orderedProduct.minimumOrderQuantity,
        orderedProduct.minimumOrderQuantity + 20,
      );
      const priceTier =
        orderedProduct.pricingTiers
          .slice()
          .reverse()
          .find((t) => orderQuantity >= t.minQuantity) ||
        orderedProduct.pricingTiers[0];
      const subtotal = orderQuantity * priceTier.pricePerUnit;
      ordersToCreate.push({
        orderNumber: `WBD-${uuidv4().substring(0, 8).toUpperCase()}`,
        customerId: getRandomElement(customers)._id.toString(),
        sellerId: orderedProduct.sellerId.toString(),
        items: [
          {
            productId: orderedProduct._id.toString(),
            productName: orderedProduct.name,
            quantity: orderQuantity,
            pricePerUnit: priceTier.pricePerUnit,
            totalPrice: subtotal,
          },
        ],
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalAmount: parseFloat((subtotal + 50).toFixed(2)),
        status: getRandomElement(Object.values(OrderStatus)),
        paymentStatus: getRandomElement(Object.values(PaymentStatus)),
        shippingAddress: {
          fullName: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
          phone: `017${getRandomNumber(10000000, 99999999)}`,
          address: `${getRandomNumber(1, 100)} Main St, Block C`,
          city: getRandomElement(cities),
          zone: 'Dhaka Division',
        },
        isSampleData: true,
      });
    }
    await this.orderModel.insertMany(ordersToCreate);
    return `Success: Created ${ordersToCreate.length} new orders.`;
  }
}
