const prisma = require('../config/prisma');

const postInclude = {
  author: { select: { id: true, name: true } },
  _count: { select: { comments: true } }
};

async function listPosts(req, res, next) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 120) : '';
    const posts = await prisma.post.findMany({
      where: q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { content: { contains: q, mode: 'insensitive' } }] } : {},
      include: postInclude,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ posts });
  } catch (err) { next(err); }
}

async function getPost(req, res, next) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true } },
        comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true } } } },
        _count: { select: { comments: true } }
      }
    });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ post });
  } catch (err) { next(err); }
}

function validatePost(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (title.length < 3 || title.length > 160) return { error: 'Title must be between 3 and 160 characters.' };
  if (content.length < 1 || content.length > 30000) return { error: 'Post content must be between 1 and 30,000 characters.' };
  return { title, content };
}

async function createPost(req, res, next) {
  try {
    const input = validatePost(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    const post = await prisma.post.create({ data: { ...input, authorId: req.user.id }, include: postInclude });
    res.status(201).json({ post });
  } catch (err) { next(err); }
}

async function updatePost(req, res, next) {
  try {
    const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Post not found.' });
    if (existing.authorId !== req.user.id) return res.status(403).json({ error: 'You can only edit your own posts.' });
    const input = validatePost(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    const post = await prisma.post.update({ where: { id: existing.id }, data: input, include: postInclude });
    res.json({ post });
  } catch (err) { next(err); }
}

async function deletePost(req, res, next) {
  try {
    const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Post not found.' });
    if (existing.authorId !== req.user.id) return res.status(403).json({ error: 'You can only delete your own posts.' });
    await prisma.post.delete({ where: { id: existing.id } });
    res.json({ message: 'Post deleted.' });
  } catch (err) { next(err); }
}

module.exports = { listPosts, getPost, createPost, updatePost, deletePost };
