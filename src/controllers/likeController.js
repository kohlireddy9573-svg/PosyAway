import { AppError } from '../middleware/errorHandler.js';
import { findPostById } from '../models/postModel.js';
import { listLikesForPost, toggleLike, userLikesPost } from '../models/likeModel.js';

export function list(request, response, next) {
  if (!findPostById(request.params.postId)) return next(new AppError(404, 'Post not found.'));
  const postLikes = listLikesForPost(request.params.postId);
  return response.json({
    likes: postLikes,
    total: postLikes.length,
    likedByMe: userLikesPost(request.user.id, request.params.postId),
  });
}

export function toggle(request, response, next) {
  if (!findPostById(request.params.postId)) return next(new AppError(404, 'Post not found.'));
  return response.json(toggleLike(request.user.id, request.params.postId));
}