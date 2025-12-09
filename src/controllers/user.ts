import { Response } from 'express';
import * as UserModel from '../models/user';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, getSortParams } from '../utils/pagination';

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userData = {
      ...req.body,
      created_by: req.user?.id
    };
    const user = await UserModel.createUser(userData);
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ 
        success: false,
        error: 'User with this email or phone already exists' 
      });
      return;
    }
    res.status(500).json({ 
      success: false,
      error: 'Failed to create user' 
    });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit } = getPaginationParams(req);
    const search = req.query.search as string | undefined;
    const sort = getSortParams(req, 'created_at DESC');
    
    const result = await UserModel.getPaginatedUsers(
      page,
      limit,
      search,
      sort
    );
    
    res.json({
      success: true,
      ...buildPaginationResponse(result.data, result.total, page, limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        error: 'Invalid user ID' 
      });
      return;
    }
    const user = await UserModel.findUserById(id);
    if (!user) {
      res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
      return;
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user' 
    });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        error: 'Invalid user ID' 
      });
      return;
    }
    const updateData = {
      ...req.body,
      updated_by: req.user?.id
    };
    const updatedUser = await UserModel.updateUser(id, updateData);
    if (!updatedUser) {
      res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
      return;
    }
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user' 
    });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        error: 'Invalid user ID' 
      });
      return;
    }
    await UserModel.deleteUser(id, req.user?.id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete user' 
    });
  }
};