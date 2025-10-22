import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from 'src/users/schemas/user.schema';

// Define an interface for the request object that includes the user property
interface RequestWithUser extends Request {
  user: UserDocument;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user; // Passport attaches the user to request.user
  },
);
