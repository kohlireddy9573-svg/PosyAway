import { AppError } from '../middleware/errorHandler.js';
import { requireText } from '../middleware/validate.js';
import { createComment, deleteCommentById, findCommentById, listCommentsForPost, updateCommentById } from '../models/commentModel.js';
import { findPostById } from '../models/postModel.js';
import { parsePagination, totalPagesFor } from '../utils/pagination.js';
import { presentComment } from '../utils/presenters.js';

export function list(request, response, next) {
  if (!findPostById(request.params.postId)) return next(new AppError(404, 'Post not found.'));
  const { page, limit } = parsePagination(request.query);
  const allComments = listCommentsForPost(request.params.postId);
  const total = allComments.length;
  const results = allComments.slice((page - 1) * limit, page * limit).map(presentComment);
  return response.json({ comments: results, page, limit, total, totalPages: totalPagesFor(total, limit) });
}

export function create(request, response, next) {
  if (!findPostById(request.params.postId)) return next(new AppError(404, 'Post not found.'));
  try {
    const comment = createComment({
      userId: request.user.id,
      postId: request.params.postId,
      content: requireText((request.body || {}).content, 'Comment', 1000),
    });
    return response.status(201).json({ comment: presentComment(comment) });
  } catch (error) { return next(error); }
}

export function update(request, response, next) {
  const comment = findCommentById(request.params.commentId);
  if (!comment) return next(new AppError(404, 'Comment not found.'));
  if (comment.userId !== request.user.id) return next(new AppError(403, 'You can only edit your own comments.'));
  try {
    const updatedComment = updateCommentById(comment.id, requireText((request.body || {}).content, 'Comment', 1000));
    return response.json({ comment: presentComment(updatedComment) });
  } catch (error) { return next(error); }
}

export function remove(request, response, next) {
  const comment = findCommentById(request.params.commentId);
  if (!comment) return next(new AppError(404, 'Comment not found.'));
  if (comment.userId !== request.user.id) return next(new AppError(403, 'You can only delete your own comments.'));
  deleteCommentById(comment.id);
  return response.status(204).end();
}