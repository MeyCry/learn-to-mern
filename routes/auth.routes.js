const {Router} = require('express');
const User = require('../models/User');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {body, validationResult} = require('express-validator');
const router = Router();

// api/auth

router.post(
  '/register',
  [
    body('email', 'Incorrect email format').isEmail().normalizeEmail(),
    body('password', 'password should be minimum 6 symbols').isLength({
      min: 6
    })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Incorrect registration data'
        });
      }

      const {email, password} = req.body;
      const candidate = await User.findOne({email});

      if (candidate) {
        return res.status(400).json({message: 'user already exist'});
      }

      const hashedPassword = await bcryptjs.hash(password, 10);
      const user = new User({
        password: hashedPassword,
        email,
      });

      await user.save();

      res.status(201).json({
        message: 'user created'
      });
    } catch (e) {
      res.status(500).json({
        message: 'Some error, try again to register'
      });
    }
  }
);
router.post(
  '/login',
  [
    body('email', 'Incorrect email format').isEmail().normalizeEmail(),
    body('password', 'No password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Incorrect login data'
        });
      }
      const {email, password} = req.body;
      const user = await User.findOne({email});

      if (!user) {
        return res.status(400).json({
          message: 'No such user'
        });
      }

      const isPasswordMatch = await bcryptjs.compare(password, user.password);

      if (!isPasswordMatch) {
        return res.status(400).json({
          message: 'incorrect password'
        });
      }

      const token = jwt.sign(
        {
          userId: user.id,
        },
        config.get('jwtSecret'),
        {
          expiresIn: '1h'
        }
      );

      res.json({
        token,
        userId: user.id
      });
    } catch (e) {
      res.status(500).json({
        message: 'Some error, try again to login'
      });
    }
  }
);

module.exports = router;
