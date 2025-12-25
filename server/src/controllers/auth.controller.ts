import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import Workspace from '../models/Workspace';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_123';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ email, passwordHash, name });

        // Create default workspace
        await Workspace.create({
            name: `${name}'s Workspace`,
            ownerId: user._id,
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.warn("GOOGLE_CLIENT_ID not set in environment variables");
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ message: 'Invalid Google Token' });
        }

        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            // Register new user
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const passwordHash = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
                email,
                name: name || 'Google User',
                passwordHash,
            });

            await Workspace.create({
                name: `${user.name}'s Workspace`,
                ownerId: user._id,
            });
        }

        const jwtToken = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token: jwtToken, user: { id: user._id, name: user.name, email: user.email } });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Google authentication failed' });
    }
};
