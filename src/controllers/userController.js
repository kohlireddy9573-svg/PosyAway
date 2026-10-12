import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler.js';
import { requireText } from '../middleware/validate.js';
import { createToken } from '../middleware/auth.js';
import { createUser, findUserByEmail, toPublicUser } from '../models/userModel.js';

export async function signUp(request, response) {
  const body = request.body || {};
  const name = requireText(body.name, 'Name', 80);
  const email = requireText(body.email, 'Email', 254).toLowerCase();
  const password = requireText(body.password, 'Password', 128);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError(400, 'Enter a valid email address.');
  if (password.length < 8) throw new AppError(400, 'Password must be at least 8 characters.');
  if (findUserByEmail(email)) throw new AppError(409, 'An account with this email already exists.');

  const user = await createUser({ name, email, password });
  response.status(201).json({ user: toPublicUser(user), token: createToken(user) });
}

export async function signIn(request, response) {
  const body = request.body || {};
  const email = requireText(body.email, 'Email', 254);
  const password = requireText(body.password, 'Password', 128);
  const user = findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, 'Email or password is incorrect.');
  }
  response.json({ user: toPublicUser(user), token: createToken(user) });
}