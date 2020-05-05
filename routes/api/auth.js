const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
// @route   GET api/auth
// @desc    Test Route
// @access  Public

router.get('/', auth, async (req, res) => {
    try {
        // select -password will not return the password
        const user = await User.findById(req.user.id).select('-password');
        res.json(user)
    } catch (e) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

module.exports = router;
