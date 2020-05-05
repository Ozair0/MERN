const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Post = require('../../models/Post');

// @route   POST api/posts
// @desc    Create a Post
// @access  Private

router.post('/', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()})
    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });
        const post = await newPost.save();
        res.json(post)
    } catch (e) {
        console.error(e.message)
        res.status(500).send('Server Error')
    }
    res.send('Posts Route')
});

// @route   GET api/posts
// @desc    GET all posts
// @access  Private

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({date: -1});
        res.json(posts);
    } catch (e) {
        console.error(e.message)
        res.status(500).send('Server Error')
    }
})

// @route   GET api/posts/:id
// @desc    GET post by id
// @access  Private

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Not Found');
        }
        res.json(post);
    } catch (e) {
        if (e.name === 'CastError') {
            return res.status(400).json({msg: 'Post not found'})
        }
        console.error(e.message)
        res.status(500).send('Server Error')
    }
})

// @route   DELETE api/posts/:id
// @desc    Delete post by id
// @access  Private

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(400).json({msg: 'Post not found'})
        }

        // Check User
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({msg: 'User not authorized'})
        }
        await post.remove();

        res.json({msg: 'Post Removed'});
    } catch (e) {
        if (e.name === 'CastError') {
            return res.status(400).json({msg: 'Post not found'})
        }
        console.error(e.message)
        res.status(500).send('Server Error')
    }
})

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(400).json({msg: 'Post not found'})
        }

        // Check If already liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({msg: 'Post already liked'})
        }

        post.likes.unshift({user: req.user.id})
        await post.save();

        res.json(post.likes);

    } catch (e) {
        if (e.name === 'CastError') {
            return res.status(400).json({msg: 'Post not found'})
        }
        console.error(e.message);
        res.status(500).send('Server Error');
    }
})

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Priva===e

router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(400).json({msg: 'Post not found'})
        }

        // Check If already liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({msg: 'Post has not been liked'})
        }

        // Get Remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);

        await post.save();

        res.json(post.likes);

    } catch (e) {
        if (e.name === 'CastError') {
            return res.status(400).json({msg: 'Post not found'})
        }
        console.error(e.message);
        res.status(500).send('Server Error');
    }
})

// @route   POST api/posts/comment/:id
// @desc    Comment on a Post
// @access  Private

router.post('/comment/:id', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()})
    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comments.unshift(newComment)
        await post.save();
        res.json(post.comments);
    } catch (e) {
        console.error(e.message)
        res.status(500).send('Server Error')
    }
    res.send('Posts Route')
});

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete Comment from a post
// @access  Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Pull out comment from the post
        const comment = post.comments.find(comment => comment.id.toString() === req.params.comment_id);
        if (!comment) {
            return res.status(404).json({msg: 'Comment Not Found'})
        }
        // User Check
        if (!comment.user.toString() === req.user.id) {
            return res.status(401).json({msg: 'User Not Authorised'})
        }

        // Get Remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        post.comments.splice(removeIndex, 1);

        post.save()
        res.json(post.comments);
    } catch (e) {
        console.error(e.message);
        res.status(500).send('Server Error')
    }
})

module.exports = router;
