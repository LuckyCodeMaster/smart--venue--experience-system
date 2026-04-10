import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types';

export const success = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

export const created = <T>(res: Response, data: T, message = 'Created'): Response =>
  success(res, data, message, 201);

export const noContent = (res: Response): Response => res.status(204).send();

export const error = (
  res: Response,
  message: string,
  statusCode = 400,
  errorDetail?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: errorDetail,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

export const paginated = <T>(
  res: Response,
  data: T[],
  total: number,
  params: PaginationParams,
  message = 'Success'
): Response => {
  const totalPages = Math.ceil(total / params.limit);
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
  return res.status(200).json(response);
};

export const getPaginationParams = (
  query: Record<string, unknown>
): PaginationParams => {
  const page = Math.max(1, parseInt(String(query['page'] ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query['limit'] ?? '20'), 10)));
  return { page, limit, offset: (page - 1) * limit };
};
