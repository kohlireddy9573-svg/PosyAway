import jwt from 'jsonwebtoken';
import { findUserById } from '../models/userModel.js';
import { AppError } from './errorHandler.js';

const jwtSecret = process.env.JWT_SECRET || 'local-development-secret-change-me';

export function createToken(user) {
  return jwt.sign({ sub: user.id }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function requireAuth(request, _response, next) {
  const [scheme, token] = (request.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Authentication required. Send a Bearer token.'));
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = findUserById(payload.sub);
    if (!user) return next(new AppError(401, 'The account for this token no longer exists.'));
    request.user = user;
    return next();
  } catch {
    return next(new AppError(401, 'Your token is invalid or expired.'));
  }
}