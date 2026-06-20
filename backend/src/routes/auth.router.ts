import { Router } from 'express';
import { register, login, refresh, logout, me, getRegistrationMasterData } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody, registerSchema, loginSchema } from '../validators/auth.validator';

const authRouter = Router();

// Public routes
authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/register-metadata', getRegistrationMasterData);

// Protected routes
authRouter.get('/me', authenticate, me);

export default authRouter;
