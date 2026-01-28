import { describe, it } from 'mocha';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../../middleware/authMiddleware.js';
import { generateToken } from '../../../utils/jwt.js';

describe('Authentication Middleware - Unit Tests', () => {
  it('should return 401 for expired token', () => {
    // Create an expired token
    const userData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'student'
    };
    
    const expiredToken = jwt.sign(
      userData,
      process.env.JWT_SECRET,
      { expiresIn: '0s' } // Expires immediately
    );
    
    const req = {
      headers: {
        authorization: `Bearer ${expiredToken}`
      }
    };
    
    let statusCode = null;
    let responseBody = null;
    
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (body) => {
        responseBody = body;
        return res;
      }
    };
    
    const next = () => {};
    
    // Wait a moment to ensure token is expired
    setTimeout(() => {
      authenticate(req, res, next);
      
      expect(statusCode).to.equal(401);
      expect(responseBody.status).to.equal('error');
      expect(responseBody.message).to.include('expired');
    }, 100);
  });

  it('should return 401 for missing Authorization header', () => {
    const req = {
      headers: {}
    };
    
    let statusCode = null;
    let responseBody = null;
    
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (body) => {
        responseBody = body;
        return res;
      }
    };
    
    const next = () => {};
    
    authenticate(req, res, next);
    
    expect(statusCode).to.equal(401);
    expect(responseBody.status).to.equal('error');
    expect(responseBody.message).to.include('Authorization header is missing');
  });

  it('should return 401 for malformed Bearer token format', () => {
    const req = {
      headers: {
        authorization: 'InvalidFormat token123'
      }
    };
    
    let statusCode = null;
    let responseBody = null;
    
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (body) => {
        responseBody = body;
        return res;
      }
    };
    
    const next = () => {};
    
    authenticate(req, res, next);
    
    expect(statusCode).to.equal(401);
    expect(responseBody.status).to.equal('error');
    expect(responseBody.message).to.include('Bearer format');
  });

  it('should return 401 for empty token after Bearer prefix', () => {
    const req = {
      headers: {
        authorization: 'Bearer '
      }
    };
    
    let statusCode = null;
    let responseBody = null;
    
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (body) => {
        responseBody = body;
        return res;
      }
    };
    
    const next = () => {};
    
    authenticate(req, res, next);
    
    expect(statusCode).to.equal(401);
    expect(responseBody.status).to.equal('error');
    expect(responseBody.message).to.include('Token is missing');
  });

  it('should successfully authenticate with valid token', () => {
    const userData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'student'
    };
    
    const token = generateToken(userData);
    
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    const res = {
      status: () => res,
      json: () => res
    };
    
    authenticate(req, res, next);
    
    expect(req.user).to.exist;
    expect(req.user.id).to.equal(userData.id);
    expect(req.user.email).to.equal(userData.email);
    expect(req.user.role).to.equal(userData.role);
    expect(nextCalled).to.be.true;
  });
});
