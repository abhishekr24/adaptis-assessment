import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401);

  if (token === 'mocktoken') {
    req.user = { id: '123', username: 'testuser' };
    next();
    return;
  } else {
    return res.sendStatus(403);
  }
};