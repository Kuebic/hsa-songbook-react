import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { z, ZodSchema, ZodError } from 'zod';
import { TypedValidationError, FormattedValidationError, ValidationErrorResponse, ZodValidationError } from '../types/validation';

/**
 * Middleware to handle express-validator results
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const response: ValidationErrorResponse = {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map((err): FormattedValidationError => {
        const typedErr = err as TypedValidationError;
        return {
          field: typedErr.type === 'field' ? typedErr.path : undefined,
          message: typedErr.msg,
          value: typedErr.type === 'field' ? typedErr.value : undefined
        };
      })
    };
    return res.status(400).json(response);
  }
  
  next();
};

/**
 * Higher-order function to create validation middleware
 */
export const validate = (validations: ValidationChain[]) => {
  return [
    ...validations,
    handleValidationErrors
  ];
};

/**
 * Zod validation middleware
 */
export const validateSchema = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source] as unknown;
      const validatedData = schema.parse(data);
      
      // Replace the request data with validated data
      (req as Record<string, unknown>)[source] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const response: ValidationErrorResponse = {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map((err): ZodValidationError => ({
            field: (err.path as (string | number)[]).join('.') || 'unknown',
            message: err.message,
            code: err.code
          }))
        };
        return res.status(400).json(response);
      }
      
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  mongoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),
  search: z.object({
    q: z.string().optional(),
    key: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: z.string().optional(), // comma-separated
    sort: z.enum(['title', 'artist', 'createdAt', 'rating', 'popularity']).default('title'),
    order: z.enum(['asc', 'desc']).default('asc')
  }).merge(z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }))
};