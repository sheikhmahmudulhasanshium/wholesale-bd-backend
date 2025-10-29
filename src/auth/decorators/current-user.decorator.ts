// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from 'src/users/schemas/user.schema';

// Define an interface for the request object that includes the user property
interface RequestWithUser extends Request {
  user?: UserDocument; // --- V MODIFIED: user is now optional ---
}

export const CurrentUser = createParamDecorator(
  // --- V MODIFIED: Return type is now UserDocument | undefined ---
  (data: unknown, ctx: ExecutionContext): UserDocument | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user; // Passport attaches the user to request.user, or it's undefined
  },
);
