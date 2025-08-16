import { Response } from './response';

describe('Response', () => {
  it('should be defined', () => {
    expect(Response).toBeDefined();
  });

  describe('Response interface structure', () => {
    it('should allow creating response with error and data', () => {
      const response: Response<string> = {
        error: '',
        data: 'test data',
      };

      expect(response.error).toBe('');
      expect(response.data).toBe('test data');
    });

    it('should allow creating response with error message', () => {
      const response: Response<null> = {
        error: 'Something went wrong',
        data: null,
      };

      expect(response.error).toBe('Something went wrong');
      expect(response.data).toBeNull();
    });

    it('should allow creating response with complex data types', () => {
      interface UserData {
        id: string;
        name: string;
        email: string;
      }

      const userData: UserData = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response: Response<UserData> = {
        error: '',
        data: userData,
      };

      expect(response.error).toBe('');
      expect(response.data).toEqual(userData);
      expect(response.data.id).toBe('123');
      expect(response.data.name).toBe('John Doe');
      expect(response.data.email).toBe('john@example.com');
    });

    it('should allow creating response with array data', () => {
      const arrayData = ['item1', 'item2', 'item3'];
      const response: Response<string[]> = {
        error: '',
        data: arrayData,
      };

      expect(response.error).toBe('');
      expect(response.data).toEqual(arrayData);
      expect(response.data.length).toBe(3);
    });

    it('should allow creating response with nested object data', () => {
      interface NestedData {
        user: {
          id: string;
          profile: {
            name: string;
            settings: {
              theme: string;
              notifications: boolean;
            };
          };
        };
        metadata: {
          timestamp: string;
          version: number;
        };
      }

      const nestedData: NestedData = {
        user: {
          id: 'user123',
          profile: {
            name: 'Jane Doe',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        metadata: {
          timestamp: '2024-01-15T10:00:00Z',
          version: 1,
        },
      };

      const response: Response<NestedData> = {
        error: '',
        data: nestedData,
      };

      expect(response.error).toBe('');
      expect(response.data.user.id).toBe('user123');
      expect(response.data.user.profile.name).toBe('Jane Doe');
      expect(response.data.user.profile.settings.theme).toBe('dark');
      expect(response.data.user.profile.settings.notifications).toBe(true);
      expect(response.data.metadata.version).toBe(1);
    });
  });

  describe('Response type flexibility', () => {
    it('should work with primitive types', () => {
      const stringResponse: Response<string> = {
        error: '',
        data: 'hello',
      };

      const numberResponse: Response<number> = {
        error: '',
        data: 42,
      };

      const booleanResponse: Response<boolean> = {
        error: '',
        data: true,
      };

      expect(stringResponse.data).toBe('hello');
      expect(numberResponse.data).toBe(42);
      expect(booleanResponse.data).toBe(true);
    });

    it('should work with union types', () => {
      const unionResponse: Response<string | number> = {
        error: '',
        data: 'could be string',
      };

      const unionResponse2: Response<string | number> = {
        error: '',
        data: 123,
      };

      expect(typeof unionResponse.data).toBe('string');
      expect(typeof unionResponse2.data).toBe('number');
    });

    it('should work with optional properties', () => {
      interface OptionalData {
        required: string;
        optional?: number;
      }

      const responseWithOptional: Response<OptionalData> = {
        error: '',
        data: {
          required: 'test',
          optional: 42,
        },
      };

      const responseWithoutOptional: Response<OptionalData> = {
        error: '',
        data: {
          required: 'test',
        },
      };

      expect(responseWithOptional.data.required).toBe('test');
      expect(responseWithOptional.data.optional).toBe(42);
      expect(responseWithoutOptional.data.required).toBe('test');
      expect(responseWithoutOptional.data.optional).toBeUndefined();
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle validation errors', () => {
      const validationResponse: Response<null> = {
        error: 'Validation failed: Email is required',
        data: null,
      };

      expect(validationResponse.error).toContain('Validation failed');
      expect(validationResponse.data).toBeNull();
    });

    it('should handle authentication errors', () => {
      const authResponse: Response<null> = {
        error: 'Unauthorized: Invalid token',
        data: null,
      };

      expect(authResponse.error).toContain('Unauthorized');
      expect(authResponse.data).toBeNull();
    });

    it('should handle not found errors', () => {
      const notFoundResponse: Response<null> = {
        error: 'Resource not found',
        data: null,
      };

      expect(notFoundResponse.error).toBe('Resource not found');
      expect(notFoundResponse.data).toBeNull();
    });

    it('should handle server errors', () => {
      const serverErrorResponse: Response<null> = {
        error: 'Internal server error',
        data: null,
      };

      expect(serverErrorResponse.error).toBe('Internal server error');
      expect(serverErrorResponse.data).toBeNull();
    });
  });

  describe('Success scenarios', () => {
    it('should handle successful creation', () => {
      interface CreatedResource {
        id: string;
        createdAt: string;
      }

      const creationResponse: Response<CreatedResource> = {
        error: '',
        data: {
          id: 'resource123',
          createdAt: '2024-01-15T10:00:00Z',
        },
      };

      expect(creationResponse.error).toBe('');
      expect(creationResponse.data.id).toBe('resource123');
    });

    it('should handle successful updates', () => {
      interface UpdatedResource {
        id: string;
        updatedAt: string;
        changes: string[];
      }

      const updateResponse: Response<UpdatedResource> = {
        error: '',
        data: {
          id: 'resource123',
          updatedAt: '2024-01-15T10:30:00Z',
          changes: ['name', 'email'],
        },
      };

      expect(updateResponse.error).toBe('');
      expect(updateResponse.data.changes).toContain('name');
    });

    it('should handle successful deletions', () => {
      interface DeletionResult {
        deleted: boolean;
        id: string;
      }

      const deletionResponse: Response<DeletionResult> = {
        error: '',
        data: {
          deleted: true,
          id: 'resource123',
        },
      };

      expect(deletionResponse.error).toBe('');
      expect(deletionResponse.data.deleted).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty error with undefined data', () => {
      const response: Response<undefined> = {
        error: '',
        data: undefined,
      };

      expect(response.error).toBe('');
      expect(response.data).toBeUndefined();
    });

    it('should handle empty string data', () => {
      const response: Response<string> = {
        error: '',
        data: '',
      };

      expect(response.error).toBe('');
      expect(response.data).toBe('');
    });

    it('should handle zero as valid data', () => {
      const response: Response<number> = {
        error: '',
        data: 0,
      };

      expect(response.error).toBe('');
      expect(response.data).toBe(0);
    });

    it('should handle false as valid data', () => {
      const response: Response<boolean> = {
        error: '',
        data: false,
      };

      expect(response.error).toBe('');
      expect(response.data).toBe(false);
    });

    it('should handle empty array as valid data', () => {
      const response: Response<any[]> = {
        error: '',
        data: [],
      };

      expect(response.error).toBe('');
      expect(response.data).toEqual([]);
      expect(response.data.length).toBe(0);
    });

    it('should handle empty object as valid data', () => {
      const response: Response<object> = {
        error: '',
        data: {},
      };

      expect(response.error).toBe('');
      expect(response.data).toEqual({});
      expect(Object.keys(response.data).length).toBe(0);
    });
  });

  describe('Generic type constraints', () => {
    it('should work with constrained generic types', () => {
      interface BaseEntity {
        id: string;
        createdAt: string;
      }

      interface User extends BaseEntity {
        name: string;
        email: string;
      }

      const userResponse: Response<User> = {
        error: '',
        data: {
          id: 'user123',
          createdAt: '2024-01-15T10:00:00Z',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      expect(userResponse.data.id).toBeDefined();
      expect(userResponse.data.createdAt).toBeDefined();
      expect(userResponse.data.name).toBeDefined();
      expect(userResponse.data.email).toBeDefined();
    });

    it('should work with readonly types', () => {
      interface ReadonlyData {
        readonly id: string;
        readonly name: string;
      }

      const readonlyResponse: Response<ReadonlyData> = {
        error: '',
        data: {
          id: 'readonly123',
          name: 'Readonly Item',
        },
      };

      expect(readonlyResponse.data.id).toBe('readonly123');
      expect(readonlyResponse.data.name).toBe('Readonly Item');
    });
  });
});
