const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

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

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public

router.post('/', [
    check('email', 'Please Include Email').isEmail(),
    check('password', 'Password is Required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {email, password} = req.body;
    try {
        // See if the user exists
        let user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({errors: [{msg: 'Invalid Credentials'}]});
        }

        const isMatch = await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.status(400).json({errors: [{msg: 'Invalid Credentials'}]});
        }


        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }
        // Use 3600 1HR for Prod!
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {expiresIn: 36000},
            (err, token) => {
                if (err) throw err;
                res.json({token});
            });
    } catch (e) {
        console.error(e.message);
        res.status(500).send('Server Error');
    }
});



module.exports = router;
