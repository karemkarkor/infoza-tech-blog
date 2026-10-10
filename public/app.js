const state = { user: null, posts: [], activePost: null, editingId: null, authMode: 'login' };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

async function api(url, options = {}) {
  const response = await fetch(`/api${url}`, {
    ...options,
    credentials: 'same-origin',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function dateLabel(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function excerpt(content, limit = 145) {
  return content.length > limit ? `${content.slice(0, limit).trimEnd()}…` : content;
}

function setStatus(message = '') {
  const el = $('#status-message');
  el.textContent = message;
  el.hidden = !message;
}

function updateHeader() {
  $('#welcome').hidden = !state.user;
  $('#welcome').textContent = state.user ? `Hello, ${state.user.name.split(' ')[0]}` : '';
  $('#new-post-button').hidden = !state.user;
  $('#login-button').hidden = !!state.user;
  $('#signup-button').hidden = !!state.user;
  $('#logout-button').hidden = !state.user;
}

function renderPosts() {
  const grid = $('#posts-grid');
  grid.replaceChildren();
  $('#result-count').textContent = `${state.posts.length} ${state.posts.length === 1 ? 'story' : 'stories'}`;
  $('#empty-state').hidden = state.posts.length !== 0;
  for (const post of state.posts) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Read ${post.title}`);
    const top = document.createElement('div'); top.className = 'card-topline';
    const category = document.createElement('span'); category.className = 'card-category'; category.textContent = 'Community story';
    const date = document.createElement('span'); date.className = 'card-date'; date.textContent = dateLabel(post.createdAt);
    top.append(category, date);
    const title = document.createElement('h3'); title.textContent = post.title;
    const body = document.createElement('p'); body.className = 'card-excerpt'; body.textContent = excerpt(post.content);
    const footer = document.createElement('div'); footer.className = 'card-footer';
    const author = document.createElement('span'); author.className = 'author';
    const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = (post.author.name[0] || '?').toUpperCase();
    const name = document.createElement('span'); name.textContent = post.author.name;
    author.append(avatar, name);
    const comments = document.createElement('span'); comments.className = 'read-more'; comments.textContent = `${post._count.comments} comments  ↗`;
    footer.append(author, comments);
    card.append(top, title, body, footer);
    card.addEventListener('click', () => openStory(post.id));
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openStory(post.id); } });
    grid.append(card);
  }
}

async function loadPosts(query = '') {
  setStatus('');
  try {
    const data = await api(`/posts${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    state.posts = data.posts;
    renderPosts();
  } catch (error) { setStatus(error.message); }
}

function makeStoryActions(post) {
  if (!state.user || state.user.id !== post.author.id) return null;
  const actions = document.createElement('div'); actions.className = 'story-actions';
  const edit = document.createElement('button'); edit.className = 'button button-outline button-small'; edit.textContent = 'Edit story';
  edit.addEventListener('click', () => openPostForm(post));
  const remove = document.createElement('button'); remove.className = 'button button-danger button-small'; remove.textContent = 'Delete story';
  remove.addEventListener('click', async () => {
    if (!window.confirm('Delete this story and its comments?')) return;
    try {
      await api(`/posts/${post.id}`, { method: 'DELETE' });
      $('#story-dialog').close();
      await loadPosts($('#search-input').value.trim());
    } catch (error) { window.alert(error.message); }
  });
  actions.append(edit, remove);
  return actions;
}

function renderComments(comments) {
  const list = $('#comments-list'); list.replaceChildren();
  $('#comment-count').textContent = `${comments.length} ${comments.length === 1 ? 'response' : 'responses'}`;
  if (!comments.length) {
    const empty = document.createElement('p'); empty.className = 'comment-empty'; empty.textContent = 'No responses yet. Start the conversation.'; list.append(empty);
  }
  for (const comment of comments) {
    const item = document.createElement('article'); item.className = 'comment';
    const head = document.createElement('div'); head.className = 'comment-head';
    const author = document.createElement('strong'); author.textContent = comment.author.name;
    const date = document.createElement('span'); date.textContent = dateLabel(comment.createdAt);
    const body = document.createElement('p'); body.textContent = comment.content;
    head.append(author, date); item.append(head, body); list.append(item);
  }
}

async function openStory(id) {
  try {
    const { post } = await api(`/posts/${id}`);
    state.activePost = post;
    const article = $('#story-content'); article.replaceChildren();
    const category = document.createElement('p'); category.className = 'eyebrow eyebrow-small'; category.textContent = 'Community story';
    const title = document.createElement('h2'); title.className = 'story-title'; title.textContent = post.title;
    const meta = document.createElement('div'); meta.className = 'story-meta'; meta.textContent = `By ${post.author.name} · ${dateLabel(post.createdAt)}`;
    const body = document.createElement('div'); body.className = 'story-body'; body.textContent = post.content;
    article.append(category, title, meta);
    const actions = makeStoryActions(post); if (actions) article.append(actions);
    article.append(body);
    renderComments(post.comments);
    $('#comment-form').hidden = !state.user;
    $('#comment-login-prompt').hidden = !!state.user;
    $('#comment-error').hidden = true;
    $('#comment-input').value = '';
    $('#story-dialog').showModal();
  } catch (error) { setStatus(error.message); }
}

function setAuthMode(mode) {
  state.authMode = mode;
  const isRegister = mode === 'register';
  $('#auth-title').textContent = isRegister ? 'Join the community' : 'Welcome back';
  $('#name-field').hidden = !isRegister;
  $('#auth-form [name="name"]').required = isRegister;
  $('#auth-form [name="password"]').autocomplete = isRegister ? 'new-password' : 'current-password';
  $$('.auth-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
  $('#auth-form button[type="submit"]').innerHTML = isRegister ? 'Create account <span>↗</span>' : 'Log in <span>↗</span>';
  $('#auth-error').hidden = true;
}

function openPostForm(post = null) {
  state.editingId = post?.id || null;
  $('#post-form-title').textContent = post ? 'Edit your story' : 'Write a story';
  $('#post-form-kicker').textContent = post ? 'A few words to refine' : 'From your notebook';
  $('#post-form [name="title"]').value = post?.title || '';
  $('#post-form [name="content"]').value = post?.content || '';
  $('#post-error').hidden = true;
  $('#post-dialog').showModal();
}

$('#search-form').addEventListener('submit', event => { event.preventDefault(); loadPosts($('#search-input').value.trim()); });
$('#login-button').addEventListener('click', () => { setAuthMode('login'); $('#auth-dialog').showModal(); });
$('#signup-button').addEventListener('click', () => { setAuthMode('register'); $('#auth-dialog').showModal(); });
$('#comment-login-button').addEventListener('click', () => { $('#story-dialog').close(); setAuthMode('login'); $('#auth-dialog').showModal(); });
$('#new-post-button').addEventListener('click', () => openPostForm());
$('#logout-button').addEventListener('click', async () => {
  try { await api('/auth/logout', { method: 'POST' }); state.user = null; updateHeader(); await loadPosts($('#search-input').value.trim()); }
  catch (error) { setStatus(error.message); }
});

$$('[data-close]').forEach(button => button.addEventListener('click', () => $(`#${button.dataset.close}`).close()));
$$('.auth-tab').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.mode)));

$('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const body = Object.fromEntries(form.entries());
  const error = $('#auth-error'); error.hidden = true;
  try {
    const { user } = await api(`/auth/${state.authMode}`, { method: 'POST', body: JSON.stringify(body) });
    state.user = user; updateHeader(); $('#auth-dialog').close(); await loadPosts($('#search-input').value.trim());
    if (state.activePost) openStory(state.activePost.id);
  } catch (err) { error.textContent = err.message; error.hidden = false; }
});

$('#post-form').addEventListener('submit', async event => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  const error = $('#post-error'); error.hidden = true;
  try {
    const url = state.editingId ? `/posts/${state.editingId}` : '/posts';
    await api(url, { method: state.editingId ? 'PUT' : 'POST', body: JSON.stringify(body) });
    $('#post-dialog').close(); await loadPosts($('#search-input').value.trim());
    if (state.editingId && state.activePost) openStory(state.editingId);
  } catch (err) { error.textContent = err.message; error.hidden = false; }
});

$('#comment-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!state.activePost) return;
  const content = $('#comment-input').value;
  const error = $('#comment-error'); error.hidden = true;
  try {
    await api(`/posts/${state.activePost.id}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
    await openStory(state.activePost.id);
    await loadPosts($('#search-input').value.trim());
  } catch (err) { error.textContent = err.message; error.hidden = false; }
});

(async function init() {
  try { const data = await api('/auth/me'); state.user = data.user; } catch { state.user = null; }
  updateHeader();
  await loadPosts();
})();
