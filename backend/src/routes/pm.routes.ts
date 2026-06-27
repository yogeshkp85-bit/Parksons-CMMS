import { Router } from 'express';
import { pmController } from '../controllers/pm.controller';

export const router = Router();

router.get('/frequencies', pmController.getFrequencies);
router.post('/frequencies', pmController.createFrequency);
router.put('/frequencies/:id', pmController.updateFrequency);
router.delete('/frequencies/:id', pmController.deleteFrequency);

router.get('/tasks', pmController.getTasks);
router.post('/tasks', pmController.createTask);
router.put('/tasks/:id', pmController.updateTask);
router.delete('/tasks/:id', pmController.deleteTask);

router.get('/schedules', pmController.getSchedules);
router.post('/schedules/generate', pmController.generateSchedules);
router.post('/schedules', pmController.createSchedule);
router.put('/schedules/:id/complete', pmController.completeSchedule);
router.put('/schedules/:id', pmController.updateSchedule);
router.delete('/schedules/:id', pmController.deleteSchedule);

router.get('/compliance', pmController.getCompliance);
