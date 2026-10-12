const state = { token: localStorage.getItem('postaway-token'), user: JSON.parse(localStorage.getItem('postaway-user') || 'null'), view: 'feed', page: 1, limit: 10, total: 0, search: '', sort: 'recent', authMode: 'signin' };
const elements = Object.fromEntries(['account-button', 'auth-dialog', 'auth-title', 'auth-submit', 'auth-form', 'auth-error', 'name-field', 'mode-switch', 'composer', 'composer-avatar', 'post-form', 'image-input', 'upload-name', 'feed-title', 'feed-eyebrow', 'feed-list', 'feed-count', 'search-input', 'sort-select', 'load-more', 'toast'].map((id) => [id.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase()), document.getElementById(id)]));
let toastTimer;

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.token) headers.set('Authorization', `Bearer ${state.token}`);
  if (!(options.body instanceof FormData) && options.body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

function notify(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove('is-visible'), 2600);
}

function setSession(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem('postaway-user', JSON.stringify(user));
  localStorage.setItem('postaway-token', token);
  syncSession();
}

function clearSession() {
  state.user = null;
  state.token = null;
  localStorage.removeItem('postaway-user');
  localStorage.removeItem('postaway-token');
  syncSession();
}

function syncSession() {
  elements.accountButton.innerHTML = state.user ? `${escapeHtml(state.user.name)} <span>↗</span>` : 'Sign in <span>↗</span>';
  elements.composer.hidden = !state.user || state.view !== 'feed';
  elements.composerAvatar.textContent = state.user?.name?.[0]?.toUpperCase() || 'P';
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function commentTemplate(comment) {
  return `<div class="comment-item"><strong>${escapeHtml(comment.user?.name || 'Community member')}</strong>${escapeHtml(comment.content)}</div>`;
}

function postTemplate(post, commentsForPost = [], liked = false, bookmarked = false, commentPage = {}) {
  const isMine = post.userId === state.user?.id;
  const image = post.imageUrl ? `<img class="post-image" src="${escapeHtml(post.imageUrl)}" alt="Image shared by a community member" loading="lazy" />` : '';
  const commentItems = commentsForPost.map(commentTemplate).join('');
  const hasMoreComments = commentPage.page * commentPage.limit < commentPage.total;
  const moreComments = hasMoreComments ? `<button class="more-comments" data-action="more-comments" data-next-page="${commentPage.page + 1}" type="button">View older comments</button>` : '';
  return `<article class="post" data-post-id="${escapeHtml(post.id)}">
    <div class="post-head"><span class="post-avatar">${escapeHtml((post.user?.name || 'P')[0].toUpperCase())}</span><div class="post-byline"><strong>${escapeHtml(post.user?.name || 'Community member')}</strong><time datetime="${escapeHtml(post.createdAt)}">${formatDate(post.createdAt)}</time></div>${isMine ? '<button class="post-menu" data-action="delete" aria-label="Delete post" title="Delete post">···</button>' : ''}</div>
    <p class="post-caption">${escapeHtml(post.caption)}</p>${image}
    <div class="post-actions"><button class="post-action ${liked ? 'is-on' : ''}" data-action="like"><span>${liked ? '♥' : '♡'}</span>${post.likesCount || 0} likes</button><button class="post-action" data-action="comments"><span>◷</span>${post.commentsCount || commentsForPost.length} comments</button><button class="post-action save-action ${bookmarked ? 'is-on' : ''}" data-action="bookmark" aria-label="${bookmarked ? 'Remove bookmark' : 'Bookmark post'}"><span>⌑</span>${bookmarked ? 'Saved' : 'Save'}</button></div>
    <div class="comment-list">${commentItems}</div>${moreComments}${state.user ? `<form class="comment-form"><input name="content" maxlength="1000" placeholder="Leave a kind thought…" aria-label="Write a comment" required /><button type="submit">Reply ↗</button></form>` : ''}
  </article>`;
}

async function getPostDetails(post) {
  const [commentData, likeData, bookmarksData] = await Promise.all([
    api(`/comments/${encodeURIComponent(post.id)}?page=1&limit=5`).catch(() => ({ comments: [], page: 1, limit: 5, total: 0 })),
    api(`/likes/${encodeURIComponent(post.id)}`).catch(() => ({ likedByMe: false })),
    api('/bookmarks').catch(() => ({ posts: [] })),
  ]);
  const commentItems = commentData.comments;
  const bookmarked = bookmarksData.posts.some((item) => item.id === post.id);
  return postTemplate(post, commentItems, likeData.likedByMe, bookmarked, commentData);
}

async function loadFeed(append = false) {
  if (!state.user) {
    elements.feedList.innerHTML = '<div class="empty-state"><strong>A community takes people.</strong>Sign in or make an account to see the feed.</div>';
    elements.feedCount.textContent = 'YOUR COMMUNITY';
    elements.loadMore.hidden = true;
    return;
  }
  const listPath = state.view === 'saved' ? '/bookmarks' : state.search ? `/posts/search?q=${encodeURIComponent(state.search)}` : `/posts?page=${state.page}&limit=${state.limit}&sort=${state.sort}`;
  try {
    const result = await api(listPath);
    let feedPosts = result.posts || [];
    if (state.view === 'saved' || state.search) feedPosts = feedPosts.slice(0, state.limit * state.page);
    state.total = result.total ?? feedPosts.length;
    const cards = await Promise.all(feedPosts.map((post) => getPostDetails(post)));
    if (!append) elements.feedList.innerHTML = '';
    elements.feedList.insertAdjacentHTML('beforeend', cards.join(''));
    if (!feedPosts.length && !append) {
      elements.feedList.innerHTML = `<div class="empty-state"><strong>${state.view === 'saved' ? 'Nothing tucked away yet.' : state.search ? 'No notes found.' : 'It’s quiet around here.'}</strong>${state.view === 'saved' ? 'Save a post and it will be waiting here.' : 'Share the first small window into your day.'}</div>`;
    }
    elements.feedCount.textContent = `${state.total} ${state.total === 1 ? 'NOTE' : 'NOTES'}${state.search ? ' FOUND' : ''}`;
    elements.loadMore.hidden = state.view === 'saved' || Boolean(state.search) || state.page * state.limit >= state.total;
  } catch (error) {
    if (error.message.includes('token')) clearSession();
    elements.feedList.innerHTML = '<div class="empty-state"><strong>Could not reach the feed.</strong>Try again in a moment.</div>';
  }
}

function setView(view) {
  state.view = view;
  state.page = 1;
  document.querySelectorAll('.rail-link').forEach((button) => button.classList.toggle('is-active', button.dataset.view === view));
  elements.feedTitle.innerHTML = `${view === 'saved' ? 'Saved posts' : 'The feed'}<span class="title-period">.</span>`;
  elements.feedEyebrow.textContent = view === 'saved' ? 'YOUR COLLECTION' : 'THE COMMUNITY';
  elements.searchInput.hidden = view === 'saved';
  elements.composer.hidden = !state.user || view !== 'feed';
  loadFeed();
}

function openAuth(mode = 'signin') {
  state.authMode = mode;
  const signup = mode === 'signup';
  elements.authTitle.textContent = signup ? 'Make yourself at home.' : 'Good to see you.';
  elements.authSubmit.innerHTML = `${signup ? 'Create account' : 'Sign in'} <span>↗</span>`;
  elements.nameField.hidden = !signup;
  elements.nameField.querySelector('input').required = signup;
  elements.modeSwitch.innerHTML = signup ? 'Already have an account? <u>Sign in</u>' : 'New here? <u>Create an account</u>';
  elements.authError.textContent = '';
  elements.authForm.reset();
  elements.authDialog.showModal();
}

elements.accountButton.addEventListener('click', () => state.user ? (clearSession(), setView('feed'), notify('You have signed out.')) : openAuth());
elements.authDialog.querySelector('.dialog-close').addEventListener('click', () => elements.authDialog.close());
elements.authDialog.addEventListener('click', (event) => { if (event.target === elements.authDialog) elements.authDialog.close(); });
elements.modeSwitch.addEventListener('click', () => openAuth(state.authMode === 'signup' ? 'signin' : 'signup'));
elements.authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(elements.authForm).entries());
  try {
    const result = await api(state.authMode === 'signup' ? '/signup' : '/signin', { method: 'POST', body: JSON.stringify(body) });
    setSession(result.user, result.token);
    elements.authDialog.close();
    setView('feed');
    notify(`Welcome${state.authMode === 'signup' ? ' to Postaway' : ' back'}, ${result.user.name}.`);
  } catch (error) { elements.authError.textContent = error.message; }
});

elements.postForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(elements.postForm);
  try {
    await api('/posts', { method: 'POST', body: form });
    elements.postForm.reset();
    elements.uploadName.textContent = '';
    state.page = 1;
    await loadFeed();
    notify('Your post is out there.');
  } catch (error) { notify(error.message); }
});

elements.imageInput.addEventListener('change', () => { elements.uploadName.textContent = elements.imageInput.files[0]?.name || ''; });
elements.searchInput.addEventListener('input', () => {
  clearTimeout(elements.searchInput.searchTimer);
  elements.searchInput.searchTimer = setTimeout(() => { state.search = elements.searchInput.value.trim(); state.page = 1; loadFeed(); }, 220);
});
elements.sortSelect.addEventListener('change', () => { state.sort = elements.sortSelect.value; state.page = 1; loadFeed(); });
elements.loadMore.addEventListener('click', () => { state.page += 1; loadFeed(true); });
document.querySelectorAll('.rail-link').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.view === 'saved' && !state.user) return openAuth();
  setView(button.dataset.view);
}));

elements.feedList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const article = button.closest('[data-post-id]');
  if (!article) return;
  try {
    if (button.dataset.action === 'comments') {
      article.querySelector('.comment-form input')?.focus();
      article.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (button.dataset.action === 'more-comments') {
      const page = Number(button.dataset.nextPage);
      const limit = 5;
      const result = await api(`/comments/${encodeURIComponent(article.dataset.postId)}?page=${page}&limit=${limit}`);
      article.querySelector('.comment-list').insertAdjacentHTML('beforeend', result.comments.map(commentTemplate).join(''));
      if (page * limit >= result.total) button.remove();
      else button.dataset.nextPage = String(page + 1);
      return;
    }
    if (button.dataset.action === 'like') await api(`/likes/toggle/${encodeURIComponent(article.dataset.postId)}`, { method: 'POST' });
    if (button.dataset.action === 'bookmark') await api(`/bookmarks/${encodeURIComponent(article.dataset.postId)}`, { method: 'POST' });
    if (button.dataset.action === 'delete' && confirm('Delete this post?')) await api(`/posts/${encodeURIComponent(article.dataset.postId)}`, { method: 'DELETE' });
    await loadFeed();
  } catch (error) { notify(error.message); }
});

elements.feedList.addEventListener('submit', async (event) => {
  if (!event.target.matches('.comment-form')) return;
  event.preventDefault();
  const article = event.target.closest('[data-post-id]');
  const content = new FormData(event.target).get('content');
  try {
    await api(`/comments/${encodeURIComponent(article.dataset.postId)}`, { method: 'POST', body: JSON.stringify({ content }) });
    await loadFeed();
    elements.feedList.querySelector(`[data-post-id="${CSS.escape(article.dataset.postId)}"] .comment-form input`)?.focus();
  } catch (error) { notify(error.message); }
});

syncSession();
loadFeed();