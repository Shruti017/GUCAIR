import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import routes from './routes';
import {notFound,errorHandler} from './middleware/errors';
import { MongoRateLimitStore } from './middleware/mongo-rate-limit-store';

export function createApiApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());
  // The browser and API now share one origin. CORS is only enabled if an
  // explicit additional origin is configured.
  app.use(cors({ origin: process.env.CLIENT_URL || false, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    store: new MongoRateLimitStore('api')
  }));
  app.use('/api/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts. Try again later.' },
    store: new MongoRateLimitStore('auth')
  }));
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
