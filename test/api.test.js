import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { resetStore } from '../src/data/store.js';
import { redactRequestBody } from '../src/middleware/requestLogger.js';

let server;
let baseUrl;
let token;
let postId;

before(async () => {
  resetStore();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function request(path, { body, auth = token, method = 'GET' } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { response, data: response.status === 204 ? null : await response.json() };
}

test('health endpoint is public', async () => {
  const { response, data } = await request('/api/health', { auth: null });
  assert.equal(response.status, 200);
  assert.equal(data.status, 'ok');
});

test('signup creates an account and returns a bearer token', async () => {
  const { response, data } = await request('/api/signup', {
    auth: null,
    method: 'POST',
    body: { name: 'Ada', email: 'ada@example.com', password: 'longpassword' },
  });
  assert.equal(response.status, 201);
  assert.equal(data.user.name, 'Ada');
  assert.equal('password' in data.user, false);
  assert.ok(data.token);
  token = data.token;
});

test('social routes require a token and support posts, comments, and likes', async () => {
  const anonymous = await request('/api/posts', { auth: null });
  assert.equal(anonymous.response.status, 401);
  const created = await request('/api/posts', { method: 'POST', body: { caption: 'A bright little day.' } });
  assert.equal(created.response.status, 201);
  assert.equal(created.data.post.user.name, 'Ada');
  postId = created.data.post.id;
  const comment = await request(`/api/comments/${postId}`, { method: 'POST', body: { content: 'Lovely!' } });
  assert.equal(comment.response.status, 201);
  assert.equal(comment.data.comment.content, 'Lovely!');
  assert.equal(comment.data.comment.user.name, 'Ada');
  const secondComment = await request(`/api/comments/${postId}`, { method: 'POST', body: { content: 'Sunshine!' } });
  assert.equal(secondComment.response.status, 201);

  const firstCommentPage = await request(`/api/comments/${postId}?page=1&limit=1`);
  const secondCommentPage = await request(`/api/comments/${postId}?page=2&limit=1`);
  assert.equal(firstCommentPage.data.total, 2);
  assert.equal(firstCommentPage.data.totalPages, 2);
  assert.equal(firstCommentPage.data.comments.length, 1);
  assert.notEqual(firstCommentPage.data.comments[0].id, secondCommentPage.data.comments[0].id);

  const updatedComment = await request(`/api/comments/${secondComment.data.comment.id}`, {
    method: 'PUT',
    body: { content: 'Sunshine, indeed!' },
  });
  assert.equal(updatedComment.data.comment.content, 'Sunshine, indeed!');
  const deletedComment = await request(`/api/comments/${comment.data.comment.id}`, { method: 'DELETE' });
  assert.equal(deletedComment.response.status, 204);

  const liked = await request(`/api/likes/toggle/${postId}`, { method: 'POST' });
  assert.equal(liked.data.liked, true);
  assert.equal(liked.data.total, 1);
  const compatibilityToggle = await request(`/api/likes/toggle/${postId}`, { method: 'GET' });
  assert.equal(compatibilityToggle.data.liked, false);
  const likedAgain = await request(`/api/likes/toggle/${postId}`, { method: 'POST' });
  assert.equal(likedAgain.data.liked, true);
  const feed = await request('/api/posts');
  assert.equal(feed.data.total, 1);
  assert.equal(feed.data.posts[0].commentsCount, 1);
  assert.equal(feed.data.posts[0].likesCount, 1);
});

test('invalid input returns a readable client error', async () => {
  const { response, data } = await request('/api/posts', { method: 'POST', body: { caption: '   ' } });
  assert.equal(response.status, 400);
  assert.equal(data.error, 'Caption is required.');
});

test('request log body redacts credentials, including nested values', () => {
  const body = redactRequestBody({ password: 'dont-log-me', profile: { accessToken: 'also-secret', caption: 'hello' } });
  assert.equal(body.includes('dont-log-me'), false);
  assert.equal(body.includes('also-secret'), false);
  assert.equal(body.includes('hello'), true);
  assert.equal((body.match(/\[REDACTED\]/g) || []).length, 2);
});