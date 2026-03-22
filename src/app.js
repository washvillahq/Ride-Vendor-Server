const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { errorConverter, errorHandler } = require('./shared/middlewares/error');
const AppError = require('./shared/utils/appError');
const responseHelper = require('./shared/utils/response');

const app = express();

// Trust proxy for safe deployment behind reverse proxies (like Nginx, Heroku, AWS ELB)
app.set('trust proxy', 1);

// Set security HTTP headers
app.use(helmet());

// Cross Origin Resource Sharing (production safe setup)
const corsOrigin = config.security.corsOrigin;
const corsOptions = {
  origin: typeof corsOrigin === 'string' && corsOrigin.includes(',')
    ? corsOrigin.split(',').map(origin => origin.trim())
    : corsOrigin,
  credentials: true, // allow cookies
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
}

// Parse JSON request body with a strict payload size limit (e.g. 10kb)
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded request body with size limits
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies
app.use(cookieParser());

// Sanitize request data to prevent MongoDB Operator Injection
app.use(mongoSanitize());

// Protect against Cross-Site Scripting (XSS) attacks by escaping HTML characters
app.use(xss());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// General API Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again in 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limit for authentication routes to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 failed login/register attempts per hour
  message: 'Too many attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts for login if possible
});

// Apply general rate limiting to all API requests
app.use('/api', apiLimiter);

// Protect auth routes specifically
// Place authLimiter directly on the auth router in auth.route.js or globally here:
app.use('/api/v1/auth', authLimiter);

// --- ROUTES ---
const authRoutes = require('./modules/auth/auth.route');
const userRoutes = require('./modules/user/user.route');
const carRoutes = require('./modules/car/car.route');
const serviceRoutes = require('./modules/service/service.route');
const bookingRoutes = require('./modules/booking/booking.route');
const orderRoutes = require('./modules/order/order.route');
const paymentRoutes = require('./modules/payment/payment.route');
const adminRoutes = require('./modules/admin/admin.route');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cars', carRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  responseHelper(res, 200, 'Server is healthy and running!');
});

// Send back a 404 error for any unknown API request
app.all('*', (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Convert errors to AppError, if needed
app.use(errorConverter);

// Global error handler (handles hiding stack traces in production)
app.use(errorHandler);

module.exports = app;
