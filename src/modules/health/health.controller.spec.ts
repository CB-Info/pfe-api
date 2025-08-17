import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return health status with correct structure', () => {
      const result = controller.checkHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('version');

      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.uptime).toBe('number');
      expect(typeof result.environment).toBe('string');
      expect(typeof result.version).toBe('string');
    });

    it('should return a valid ISO timestamp', () => {
      const result = controller.checkHealth();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(result.timestamp);
    });

    it('should return positive uptime', () => {
      const result = controller.checkHealth();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
