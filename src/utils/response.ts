export class Response<T> {
  error: string | null;
  data?: T;

  static successResponse<T>(data: T): Response<T> {
    return {
      error: null,
      data,
    };
  }

  static errorResponse<T>(error: string): Response<T> {
    return {
      error,
      data: undefined,
    };
  }
}
