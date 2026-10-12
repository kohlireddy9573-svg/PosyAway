import { AppError } from '../middleware/errorHandler.js';
import { requireText } from '../middleware/validate.js';
import { createPost, deletePostById, findPostById, listPosts, listPostsByUser, searchPosts, updatePostById } from '../models/postModel.js';
import { deleteCommentsForPost } from '../models/commentModel.js';
import { deleteLikesForPost } from '../models/likeModel.js';
import { deleteBookmarksForPost } from '../models/bookmarkModel.js';
import { parsePagination, totalPagesFor } from '../utils/pagination.js';
import { presentPost } from '../utils/presenters.js';

export function search(request, response) {
  const results = searchPosts(String(request.query.q || '')).map(presentPost);
  response.json({ posts: results, total: results.length });
}

export function listByUser(request, response) {
  const includePrivate = request.params.userId === request.user.id;
  const results = listPostsByUser(request.params.userId, includePrivate).map(presentPost);
  response.json({ posts: results, total: results.length });
}

export function list(request, response) {
  const { page, limit } = parsePagination(request.query);
  const results = listPosts(request.query.sort === 'popular' ? 'popular' : 'recent');
  const total = results.length;
  response.json({
    posts: results.slice((page - 1) * limit, page * limit).map(presentPost),
    page,
    limit,
    total,
    totalPages: totalPagesFor(total, limit),
  });
}

export function get(request, response, next) {
  const post = findPostById(request.params.id);
  if (!post || ((post.isDraft || post.isArchived) && post.userId !== request.user.id)) {
    return next(new AppError(404, 'Post not found.'));
  }
  return response.json({ post: presentPost(post) });
}

export function create(request, response, next) {
  try {
    const body = request.body || {};
    const post = createPost({
      userId: request.user.id,
      caption: requireText(body.caption, 'Caption', 2000),
      imageUrl: request.file ? `/uploads/${request.file.filename}` : body.imageUrl,
      isDraft: body.isDraft === 'true' || body.isDraft === true,
    });
    return response.status(201).json({ post: presentPost(post) });
  } catch (error) { return next(error); }
}

export function update(request, response, next) {
  const post = findPostById(request.params.id);
  if (!post) return next(new AppError(404, 'Post not found.'));
  if (post.userId !== request.user.id) return next(new AppError(403, 'You can only edit your own posts.'));

  try {
    const body = request.body || {};
    const updates = {};
    if (body.caption !== undefined) updates.caption = requireText(body.caption, 'Caption', 2000);
    if (request.file) updates.imageUrl = `/uploads/${request.file.filename}`;
    else if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl || null;
    if (body.isDraft !== undefined) updates.isDraft = body.isDraft === 'true' || body.isDraft === true;
    if (body.isArchived !== undefined) updates.isArchived = body.isArchived === 'true' || body.isArchived === true;
    const updatedPost = updatePostById(post.id, updates);
    return response.json({ post: presentPost(updatedPost) });
  } catch (error) { return next(error); }
}

export function remove(request, response, next) {
  const post = findPostById(request.params.id);
  if (!post) return next(new AppError(404, 'Post not found.'));
  if (post.userId !== request.user.id) return next(new AppError(403, 'You can only delete your own posts.'));
  deletePostById(post.id);
  deleteCommentsForPost(post.id);
  deleteLikesForPost(post.id);
  deleteBookmarksForPost(post.id);
  return response.status(204).end();
}

