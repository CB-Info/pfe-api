import * as Joi from 'joi';

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}

// Configuration schema validation with Joi
export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGO_URL: Joi.string().required(),
  API_KEY: Joi.string().required(),
  ALLOWED_ORIGINS: Joi.string().optional(),
});

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoUrl: process.env.MONGO_URL,
  apiKey: process.env.API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS,
});
