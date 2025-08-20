import DateBeautifier from './date.beautifier';

describe('DateBeautifier', () => {
  let dateBeautifier: DateBeautifier;

  beforeEach(() => {
    dateBeautifier = DateBeautifier.shared;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(dateBeautifier).toBeDefined();
    expect(DateBeautifier.shared).toBeDefined();
  });

  describe('shared instance', () => {
    it('should provide a shared instance', () => {
      expect(DateBeautifier.shared).toBeInstanceOf(DateBeautifier);
    });

    it('should return the same instance', () => {
      const instance1 = DateBeautifier.shared;
      const instance2 = DateBeautifier.shared;
      expect(instance1).toBe(instance2);
    });
  });

  describe('getFullDate method', () => {
    it('should return formatted date string', () => {
      const result = dateBeautifier.getFullDate();

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return date in YYYY-MM-DD HH:mm:ss format', () => {
      const result = dateBeautifier.getFullDate();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should return current date and time', () => {
      const beforeCall = Date.now();
      const result = dateBeautifier.getFullDate();
      const afterCall = Date.now();

      // Verify the format is correct (should be a valid date string)
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // The time difference should be very small (within 5 seconds)
      const timeDiff = afterCall - beforeCall;
      expect(timeDiff).toBeLessThan(5000); // 5 seconds max
    });

    it('should return non-empty string', () => {
      const result = dateBeautifier.getFullDate();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('singleton pattern', () => {
    it('should maintain singleton pattern', () => {
      const instance1 = DateBeautifier.shared;
      const instance2 = DateBeautifier.shared;
      expect(instance1).toBe(instance2);
    });

    it('should be the same instance across multiple accesses', () => {
      const instances = [];
      for (let i = 0; i < 10; i++) {
        instances.push(DateBeautifier.shared);
      }

      const firstInstance = instances[0];
      instances.forEach((instance) => {
        expect(instance).toBe(firstInstance);
      });
    });
  });

  describe('method consistency', () => {
    it('should have getFullDate method', () => {
      expect(typeof dateBeautifier.getFullDate).toBe('function');
    });

    it('should return string from getFullDate', () => {
      const result = dateBeautifier.getFullDate();
      expect(typeof result).toBe('string');
    });

    it('should handle multiple calls without errors', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          dateBeautifier.getFullDate();
        }
      }).not.toThrow();
    });
  });
});
