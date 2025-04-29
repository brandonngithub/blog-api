const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('./prisma/client');

// Local Strategy for username/password login
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        return done(null, false, { message: 'Incorrect email or password' });
      }
      
      // Compare hashed password (assuming you've stored hashed passwords)
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return done(null, false, { message: 'Incorrect email or password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// JWT configuration
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret_key', // Use environment variable in production
};

// Passport JWT strategy
passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, jwtOptions.secretOrKey, {
    expiresIn: '1h',
  });
};

// Middleware to protect routes
const authenticate = passport.authenticate('jwt', { session: false });

module.exports = {
  passport,
  generateToken,
  authenticate,
};
