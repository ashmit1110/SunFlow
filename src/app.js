import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import customerRouter from './routes/customer.routes.js';
import leadRouter from './routes/lead.routes.js';
import surveyRouter from './routes/survey.routes.js';
import productRouter from './routes/product.routes.js';
import inventoryRouter from './routes/inventory.routes.js';
import bomTemplateRouter from './routes/bomTemplate.routes.js';
import quoteRouter from './routes/quote.routes.js';

const app = express();

app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/customers', customerRouter);
app.use('/api/products', productRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/bom-templates', bomTemplateRouter);
app.use('/api', surveyRouter);
app.use('/api', quoteRouter);
app.use('/api/leads', leadRouter);
app.use('/api', healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
