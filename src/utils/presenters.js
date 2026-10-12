import { countCommentsForPost } from '../models/commentModel.js';
import { countLikesForPost } from '../models/likeModel.js';
import { findUserById, toPublicUser } from '../models/userModel.js';

export function presentPost(post) {
  return {
    ...post,
    user: toPublicUser(findUserById(post.userId)),
    likesCount: countLikesForPost(post.id),
    commentsCount: countCommentsForPost(post.id),
  };
}

export function presentComment(comment) {
  return { ...comment, user: toPublicUser(findUserById(comment.userId)) };
}