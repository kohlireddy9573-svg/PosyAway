import { posts } from '../data/store.js';
import { createId } from '../utils/ids.js';
import { countLikesForPost } from './likeModel.js';

export function createPost({ userId, caption, imageUrl, isDraft = false }) {
  const now = new Date().toISOString();
  const post = {
    id: createId(),
    userId,
    caption: caption.trim(),
    imageUrl: imageUrl || null,
    isDraft: Boolean(isDraft),
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };
  posts.push(post);
  return post;
}

export function findPostById(id) {
  return posts.find((post) => post.id === id);
}

export function listPosts(sort = 'recent') {
  const visible = posts.filter((post) => !post.isDraft && !post.isArchived);
  return visible.sort((first, second) => {
    if (sort === 'popular') {
      const engagementDifference = countLikesForPost(second.id) - countLikesForPost(first.id);
      if (engagementDifference !== 0) return engagementDifference;
    }
    return Date.parse(second.createdAt) - Date.parse(first.createdAt);
  });
}

export function searchPosts(query) {
  const normalizedQuery = query.trim().toLowerCase();
  return posts.filter((post) => !post.isDraft && !post.isArchived && post.caption.toLowerCase().includes(normalizedQuery));
}

export function listPostsByUser(userId, includePrivate = false) {
  return posts.filter((post) => post.userId === userId && (includePrivate || (!post.isDraft && !post.isArchived)));
}

export function updatePostById(id, updates) {
  const post = findPostById(id);
  if (!post) return undefined;
  Object.assign(post, updates, { updatedAt: new Date().toISOString() });
  return post;
}

export function deletePostById(id) {
  const index = posts.findIndex((post) => post.id === id);
  if (index < 0) return false;
  posts.splice(index, 1);
  return true;
}