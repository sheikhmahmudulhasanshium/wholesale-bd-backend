// src/config/validation.ts

import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),

  // SMTP (for email verification, password reset)
  SMTP_HOST: Joi.string().when('NODE_ENV', {
    is: Joi.string().valid('production', 'development'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  SMTP_PORT: Joi.number().when('NODE_ENV', {
    is: Joi.string().valid('production', 'development'),
    then: Joi.number().required(),
    otherwise: Joi.number().optional(),
  }),
  SMTP_SECURE: Joi.boolean().when('NODE_ENV', {
    is: Joi.string().valid('production', 'development'),
    then: Joi.boolean().required(),
    otherwise: Joi.boolean().optional(),
  }),
  SMTP_USER: Joi.string().when('NODE_ENV', {
    is: Joi.string().valid('production', 'development'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  SMTP_PASS: Joi.string().when('NODE_ENV', {
    is: Joi.string().valid('production', 'development'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  SMTP_FROM_NAME: Joi.string().optional(),
  SMTP_FROM_EMAIL: Joi.string()
    .email()
    .when('NODE_ENV', {
      is: Joi.string().valid('production', 'development'),
      then: Joi.string().required(),
      otherwise: Joi.string().optional(),
    }),

  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

  // +++ ADD R2 VALIDATION RULES +++
  R2_ENDPOINT: Joi.string().uri().required(),
  R2_ACCESS_KEY_ID: Joi.string().required(),
  R2_SECRET_ACCESS_KEY: Joi.string().required(),
  R2_BUCKET_NAME: Joi.string().required(),
  R2_PUBLIC_URL: Joi.string().uri().required(),
  // Firebase (if fully integrating)
  // FIREBASE_PROJECT_ID: Joi.string().optional(),
  // FIREBASE_CLIENT_EMAIL: Joi.string().email().optional(),
  // FIREBASE_PRIVATE_KEY: Joi.string().optional(),
});
