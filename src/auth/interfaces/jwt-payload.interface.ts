import { UserRole } from 'src/users/schemas/user.schema';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  // Add other necessary user info to the payload
}
