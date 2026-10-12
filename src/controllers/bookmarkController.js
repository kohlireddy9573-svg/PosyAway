import { AppError } from '../middleware/errorHandler.js';
import { findPostById } from '../models/postModel.js';
import { listBookmarksForUser, toggleBookmark } from '../models/bookmarkModel.js';
import { presentPost } from '../utils/presenters.js';

export function list(request, response) {
  const saved = listBookmarksForUser(request.user.id)
    .map((bookmark) => findPostById(bookmark.postId))
    .filter(Boolean)
    .map(presentPost);
  response.json({ posts: saved, total: saved.length });
}

export function toggle(request, response, next) {
  if (!findPostById(request.params.postId)) return next(new AppError(404, 'Post not found.'));
  return response.json({ bookmarked: toggleBookmark(request.user.id, request.params.postId) });
}