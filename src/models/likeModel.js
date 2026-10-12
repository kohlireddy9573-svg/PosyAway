import { likes } from '../data/store.js';
import { createId } from '../utils/ids.js';

export function listLikesForPost(postId) {
  return likes.filter((like) => like.postId === postId);
}

export function countLikesForPost(postId) {
  return listLikesForPost(postId).length;
}

export function userLikesPost(userId, postId) {
  return likes.some((like) => like.userId === userId && like.postId === postId);
}

export function toggleLike(userId, postId) {
  const index = likes.findIndex((like) => like.userId === userId && like.postId === postId);
  if (index >= 0) likes.splice(index, 1);
  else likes.push({ id: createId(), userId, postId, createdAt: new Date().toISOString() });
  return { liked: index < 0, total: countLikesForPost(postId) };
}

export function deleteLikesForPost(postId) {
  const remaining = likes.filter((like) => like.postId !== postId);
  likes.splice(0, likes.length, ...remaining);
}