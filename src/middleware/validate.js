import { AppError } from './errorHandler.js';

export function requireText(value, field, maximum = 2000) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(400, `${field} is required.`);
  }
  if (value.trim().length > maximum) {
    throw new AppError(400, `${field} must be ${maximum} characters or fewer.`);
  }
  return value.trim();
}