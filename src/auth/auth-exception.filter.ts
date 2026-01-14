/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // Extract the original error message
    const exceptionResponse = exception.getResponse();
    let message = 'Unauthorized';
    let details: string | undefined = undefined;

    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      message = exceptionResponse.message as string;
    }

    // Check for specific JWT errors
    if (exception.message?.includes('invalid signature')) {
      message = 'Authentication failed: Invalid token signature';
      details = 'Your authentication token is invalid. Please log in again.';
    } else if (exception.message?.includes('jwt expired')) {
      message = 'Authentication failed: Token expired';
      details = 'Your session has expired. Please log in again.';
    } else if (exception.message?.includes('jwt malformed')) {
      message = 'Authentication failed: Malformed token';
      details = 'Your authentication token is invalid. Please log in again.';
    } else if (exception.message?.includes('No auth token')) {
      message = 'Authentication required';
      details = 'Please provide an authentication token.';
    }

    response.status(status).json({
      statusCode: status,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
