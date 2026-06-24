import { Router } from 'express';
import { configController } from '../controllers/config.controller';

export const router = Router();

router.get('/masters', configController.getMasters);
