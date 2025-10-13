// FILE: src/common/filters/http-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>() as Response;
    const request = ctx.getRequest<any>() as Request;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    let errorMessage: string | string[] = 'Internal server error';
    let errorName: string | undefined = 'Internal Server Error';

    if (typeof rawMessage === 'string') {
      errorMessage = rawMessage;
    } else if (
      typeof rawMessage === 'object' &&
      rawMessage !== null &&
      'message' in rawMessage
    ) {
      const payload = rawMessage as {
        message: string | string[];
        error?: string;
      };
      errorMessage = payload.message;
      if (status < 500) {
        errorName = payload.error;
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: errorName,
      message: errorMessage,
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Status: ${status} - Internal Server Error`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - Status: ${status} - Message: ${JSON.stringify(
          rawMessage,
        )}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
