import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'voyage-ai-super-secret-key-123456';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const parseCookies = (cookieHeader?: string) => {
  const cookies: { [key: string]: string } = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    cookies[name] = value;
  });
  return cookies;
};

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin required.' });
  }
  next();
};
