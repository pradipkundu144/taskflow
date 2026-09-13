import { Router } from 'express';
import {
  loginController,
  logoutController,
  refreshController,
  registerController,
} from './auth.controller';
import { loginRateLimit, registerRateLimit } from './rate-limit';

export const authRouter = Router();

authRouter.post('/register', registerRateLimit, registerController);
authRouter.post('/login', loginRateLimit, loginController);
authRouter.post('/refresh', refreshController);
authRouter.post('/logout', logoutController);
