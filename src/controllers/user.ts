import { Request, Response } from 'express';
import * as UserModel from '../models/user';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', search } = req.query;
    const paginatedResponse = await UserModel.getPaginatedUsers(
      parseInt(page as string),
      parseInt(limit as string),
      search as string | undefined
    );
    res.json(paginatedResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};