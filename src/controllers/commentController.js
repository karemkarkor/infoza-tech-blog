const prisma = require('../config/prisma');

async function createComment(req, res, next) {
  try {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 3000) return res.status(400).json({ error: 'Comment must be between 1 and 3,000 characters.' });
    const post = await prisma.post.findUnique({ where: { id: req.params.postId }, select: { id: true } });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const comment = await prisma.comment.create({
      data: { content, postId: post.id, authorId: req.user.id },
      include: { author: { select: { id: true, name: true } } }
    });
    res.status(201).json({ comment });
  } catch (err) { next(err); }
}

module.exports = { createComment };
