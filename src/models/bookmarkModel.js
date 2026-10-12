import { bookmarks } from '../data/store.js';
import { createId } from '../utils/ids.js';

export function listBookmarksForUser(userId) {
  return bookmarks.filter((bookmark) => bookmark.userId === userId);
}

export function toggleBookmark(userId, postId) {
  const index = bookmarks.findIndex((bookmark) => bookmark.userId === userId && bookmark.postId === postId);
  if (index >= 0) bookmarks.splice(index, 1);
  else bookmarks.push({ id: createId(), userId, postId, createdAt: new Date().toISOString() });
  return index < 0;
}

export function deleteBookmarksForPost(postId) {
  const remaining = bookmarks.filter((bookmark) => bookmark.postId !== postId);
  bookmarks.splice(0, bookmarks.length, ...remaining);
}