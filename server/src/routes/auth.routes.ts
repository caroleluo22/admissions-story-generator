import { Router } from 'express';
import { register, login, googleLogin } from '../controllers/auth.controller';

const router = Router();

// Define routes with specific paths like /register and /login
// The parent router (in app.ts) will mount this at /api/auth
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

export default router;
