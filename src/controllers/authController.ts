import { Request, Response } from 'express';
import authService from '../services/authServices'; 
//import authService from '../services/authService';

export const registro = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await authService.registrar(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};