/**
 * @file validation.ts
 * @description Type definitions for validation middleware
 */

import { ValidationError as ExpressValidationError } from 'express-validator';

/**
 * Extended validation error with proper typing
 */
export interface TypedValidationError extends ExpressValidationError {
  type: 'field' | 'alternative' | 'alternative_grouped' | 'unknown_fields';
  path?: string;
  value?: unknown;
  msg: string;
}

/**
 * Formatted validation error for API responses
 */
export interface FormattedValidationError {
  field?: string;
  message: string;
  value?: unknown;
  code?: string;
}

/**
 * Validation error response structure
 */
export interface ValidationErrorResponse {
  error: string;
  code: string;
  details: FormattedValidationError[];
}

/**
 * Zod error formatter
 */
export interface ZodValidationError {
  field: string;
  message: string;
  code: string;
}