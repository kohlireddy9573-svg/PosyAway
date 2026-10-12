export const users = [];
export const posts = [];
export const comments = [];
export const likes = [];
export const bookmarks = [];

export function resetStore() {
  users.length = 0;
  posts.length = 0;
  comments.length = 0;
  likes.length = 0;
  bookmarks.length = 0;
}