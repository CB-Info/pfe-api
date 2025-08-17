import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';
import { Error as MongooseError } from 'mongoose';

interface ErrorResponse {
  errorCode: string;
  message: string;
  details?: any;
}

interface MongoDuplicateError {
  code: number;
  keyPattern?: Record<string, any>;
  keyValue?: Record<string, any>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const errorResponse = this.buildErrorResponse(exception);
    const httpStatus = this.getHttpStatus(exception);

    // Log error (with stack in development)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else {
      this.logger.error(
        `${request.method} ${request.url} - ${errorResponse.errorCode}: ${errorResponse.message}`,
      );
    }

    response.status(httpStatus).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown): ErrorResponse {
    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    // Handle Mongoose validation errors
    if (exception instanceof MongooseError.ValidationError) {
      return this.handleMongooseValidationError(exception);
    }

    // Handle Mongoose cast errors (invalid ObjectId, etc.)
    if (exception instanceof MongooseError.CastError) {
      return this.handleMongooseCastError(exception);
    }

    // Handle MongoDB duplicate key errors
    if (this.isMongoDuplicateError(exception)) {
      return this.handleMongoDuplicateError(exception);
    }

    // Handle class-validator validation errors (if they somehow reach here)
    if (this.isValidationErrorArray(exception)) {
      return this.handleClassValidatorError(exception);
    }

    // Handle generic errors
    if (exception instanceof Error) {
      return {
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred',
        ...(process.env.NODE_ENV !== 'production' && {
          details: { originalMessage: exception.message },
        }),
      };
    }

    // Fallback for unknown exceptions
    return {
      errorCode: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    };
  }

  private handleHttpException(exception: HttpException): ErrorResponse {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Handle NestJS validation pipe errors
    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse &&
      Array.isArray((exceptionResponse as any).message)
    ) {
      return {
        errorCode: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          errors: (exceptionResponse as any).message,
        },
      };
    }

    // Handle other HTTP exceptions
    const errorCode = this.getErrorCodeFromHttpStatus(status);
    const message = this.getMessageFromHttpException(exception);

    return {
      errorCode,
      message,
      ...(typeof exceptionResponse === 'object' &&
        'details' in exceptionResponse && {
          details: (exceptionResponse as any).details,
        }),
    };
  }

  private handleMongooseValidationError(
    error: MongooseError.ValidationError,
  ): ErrorResponse {
    const validationErrors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
      value: (err as any).value,
    }));

    return {
      errorCode: 'VALIDATION_ERROR',
      message: 'Data validation failed',
      details: {
        errors: validationErrors,
      },
    };
  }

  private handleMongooseCastError(
    error: MongooseError.CastError,
  ): ErrorResponse {
    return {
      errorCode: 'INVALID_INPUT',
      message: `Invalid ${error.path}: ${error.value}`,
      details: {
        field: error.path,
        value: error.value,
        expectedType: error.kind,
      },
    };
  }

  private handleMongoDuplicateError(error: MongoDuplicateError): ErrorResponse {
    const field = Object.keys((error as any).keyPattern || {})[0] || 'field';
    const value = (error as any).keyValue?.[field] || 'unknown';

    return {
      errorCode: 'DUPLICATE_ENTRY',
      message: `${field} '${value}' already exists`,
      details: {
        field,
        value,
      },
    };
  }

  private handleClassValidatorError(errors: ValidationError[]): ErrorResponse {
    const validationErrors = errors.map((error) => ({
      field: error.property,
      message: Object.values(error.constraints || {}).join(', '),
      value: error.value,
    }));

    return {
      errorCode: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: {
        errors: validationErrors,
      },
    };
  }

  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof MongooseError.ValidationError) {
      return HttpStatus.BAD_REQUEST;
    }

    if (exception instanceof MongooseError.CastError) {
      return HttpStatus.BAD_REQUEST;
    }

    if (this.isMongoDuplicateError(exception)) {
      return HttpStatus.CONFLICT;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorCodeFromHttpStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusMap[status] || `HTTP_${status}`;
  }

  private getMessageFromHttpException(exception: HttpException): string {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && 'message' in response) {
      const message = (response as any).message;
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message)) {
        return message.join(', ');
      }
    }

    return exception.message || 'An error occurred';
  }

  private isMongoDuplicateError(
    exception: unknown,
  ): exception is MongoDuplicateError {
    return (
      exception instanceof Error &&
      'code' in exception &&
      (exception as any).code === 11000
    );
  }

  private isValidationErrorArray(
    exception: unknown,
  ): exception is ValidationError[] {
    return (
      Array.isArray(exception) &&
      exception.length > 0 &&
      exception[0] instanceof ValidationError
    );
  }
}
