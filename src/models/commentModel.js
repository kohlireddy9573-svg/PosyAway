import { comments } from '../data/store.js';
import { createId } from '../utils/ids.js';

export function createComment({ userId, postId, content }) {
  const now = new Date().toISOString();
  const comment = { id: createId(), userId, postId, content: content.trim(), createdAt: now, updatedAt: now };
  comments.push(comment);
  return comment;
}

export function listCommentsForPost(postId) {
  return comments
    .filter((comment) => comment.postId === postId)
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
}

export function countCommentsForPost(postId) {
  return comments.filter((comment) => comment.postId === postId).length;
}

export function findCommentById(id) {
  return comments.find((comment) => comment.id === id);
}

export function updateCommentById(id, content) {
  const comment = findCommentById(id);
  if (!comment) return undefined;
  comment.content = content;
  comment.updatedAt = new Date().toISOString();
  return comment;
}

export function deleteCommentById(id) {
  const index = comments.findIndex((comment) => comment.id === id);
  if (index < 0) return false;
  comments.splice(index, 1);
  return true;
}

export function deleteCommentsForPost(postId) {
  const remaining = comments.filter((comment) => comment.postId !== postId);
  comments.splice(0, comments.length, ...remaining);
}