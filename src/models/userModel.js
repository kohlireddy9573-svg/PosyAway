import bcrypt from 'bcryptjs';
import { users } from '../data/store.js';
import { createId } from '../utils/ids.js';

export async function createUser({ name, email, password }) {
  const user = {
    id: createId(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: await bcrypt.hash(password, 12),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

export function findUserByEmail(email) {
  return users.find((user) => user.email === email.trim().toLowerCase());
}

export function findUserById(id) {
  return users.find((user) => user.id === id);
}

export function toPublicUser(user) {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}