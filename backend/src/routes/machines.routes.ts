import { Router } from 'express';
import { machineController } from '../controllers/machine.controller';
import { MachineController as LegacyMachineController } from '../controllers/MachineController';

export const router = Router();
const legacyMachineCtrl = new LegacyMachineController();

router.get('/validation', machineController.validateMachines);
router.get('/', machineController.getMachines);
router.post('/init', (req, res) => legacyMachineCtrl.init(req, res));
router.post('/save', (req, res) => legacyMachineCtrl.save(req, res));
router.post('/', machineController.createMachine);
router.get('/:id', machineController.getMachineById);
router.put('/:id', machineController.updateMachine);

router.delete('/:idOrName', (req: any, res: any) => {
  const { idOrName } = req.params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName);
  if (isUuid) {
    return machineController.deleteMachine(req, res);
  } else {
    req.params.name = idOrName;
    return legacyMachineCtrl.delete(req, res);
  }
});
