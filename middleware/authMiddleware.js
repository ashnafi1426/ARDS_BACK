import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware to authenticate JWT tokens
 * Extracts token from Authorization header (Bearer format),
 * verifies it, and attaches user data to req.user
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        status: 'fail',
        message: 'No authorization token provided'
      });
    }
    
    // Check Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid authorization format. Use: Bearer <token>'
      });
    }
    
    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user data to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    // Handle token verification errors
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        status: 'fail',
        message: 'Token has expired'
      });
    } else if (error.message === 'Invalid token') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token'
      });
    } else {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication failed'
      });
    }
  }
};
