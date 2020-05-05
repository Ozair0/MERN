const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route   GET api/users
// @desc    Register User
// @access  Public

router.post('/', [
    check('name', 'Name is required!').not().isEmpty(),
    check('email', 'Please Include Email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({min: 6})
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {name, email, password} = req.body;
    try {
        // See if the user exists
        let user = await User.findOne({email});
        if (user) {
            return res.status(400).json({errors: [{msg: 'User already exists'}]});
        }
        // Get Users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        // Create User Instance
        user = new User({
            name,
            email,
            avatar,
            password
        });
        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        //Save User To DB
        await user.save();

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
