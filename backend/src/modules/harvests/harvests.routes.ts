import { Router } from 'express';
import { HarvestsController } from './harvests.controller';
import { optionalAuthToken } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new HarvestsController();

router.use(optionalAuthToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);

export default router;
