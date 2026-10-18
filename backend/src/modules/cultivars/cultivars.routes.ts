import { Router } from 'express';
import { CultivarsController } from './cultivars.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new CultivarsController();

router.use(optionalAuthToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);

export default router;
