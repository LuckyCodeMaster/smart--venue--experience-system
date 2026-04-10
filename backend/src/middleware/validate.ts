import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { error } from '../utils/apiResponse';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (
  schema: Joi.Schema,
  target: ValidationTarget = 'body'
) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error: validationError, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (validationError) {
      const messages = validationError.details.map((d) => d.message).join('; ');
      error(res, `Validation failed: ${messages}`, 422);
      return;
    }

    req[target] = value as Record<string, unknown>;
    next();
  };

export const validateBody = (schema: Joi.Schema) => validate(schema, 'body');
export const validateQuery = (schema: Joi.Schema) => validate(schema, 'query');
export const validateParams = (schema: Joi.Schema) => validate(schema, 'params');
