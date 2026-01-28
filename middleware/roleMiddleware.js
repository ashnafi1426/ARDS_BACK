/**
 * Middleware factory to check user roles
 * Restricts access based on user roles
 * 
 * @param {...string} allowedRoles - Roles that can access the route
 * @returns {Function} Express middleware function
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
    }
    
    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Insufficient permissions. Required role: ' + allowedRoles.join(' or ')
      });
    }
    
    next();
  };
};
