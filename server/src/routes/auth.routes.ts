import { Router } from 'express';
import { login, register, getHelpers, createHelper, updateHelper, deleteHelper } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// Helper Management
router.get('/helpers', authenticate, getHelpers);
router.post('/helpers', authenticate, createHelper);
router.put('/helpers/:id', authenticate, updateHelper);
router.delete('/helpers/:id', authenticate, deleteHelper);

export default router;
