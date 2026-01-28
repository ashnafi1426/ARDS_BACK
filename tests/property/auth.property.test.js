import fc from 'fast-check';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { authenticate } from '../../middleware/authMiddleware.js';
import { generateToken } from '../../utils/jwt.js';

// Feature: backend-restructure, Authentication Middleware Properties
describe('Authentication Middleware - Property Tests', () => {
  
  /**
   * Property 1: JWT Token Verification and User Data Attachment
   * For any valid JWT token containing user data, when the authentication middleware 
   * processes a request with that token, the middleware should verify the token and 
   * attach the decoded user data to the request object.
   * Validates: Requirements 3.1, 3.2
   */
  it('should verify valid tokens and attach user data to request', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          role: fc.constantFrom('student', 'advisor', 'admin')
        }),
        async (userData) => {
          // Generate valid token
          const token = generateToken(userData);
          
          // Mock request and response
          const req = {
            headers: {
              authorization: `Bearer ${token}`
            }
          };
          
          const res = {
            status: function(code) {
              this.statusCode = code;
              return this;
            },
            json: function(data) {
              this.body = data;
              return this;
            }
          };
          
          let nextCalled = false;
          const next = () => { nextCalled = true; };
          
          // Call middleware
          await authenticate(req, res, next);
          
          // Verify next was called
          expect(nextCalled).to.be.true;
          
          // Verify user data attached to request
          expect(req.user).to.exist;
          expect(req.user.id).to.equal(userData.id);
          expect(req.user.email).to.equal(userData.email);
          expect(req.user.role).to.equal(userData.role);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Invalid Token Rejection
   * For any request with an invalid, missing, or malformed JWT token, 
   * the authentication middleware should return a 401 Unauthorized response.
   * Validates: Requirements 3.3
   */
  it('should return 401 for invalid, missing, or malformed tokens', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing authorization header
          fc.constant({}),
          // Invalid format (no Bearer prefix)
          fc.constant({ authorization: 'InvalidToken123' }),
          // Malformed token
          fc.constant({ authorization: 'Bearer invalid.token.here' }),
          // Empty token
          fc.constant({ authorization: 'Bearer ' })
        ),
        async (headers) => {
          const req = { headers };
          
          const res = {
            statusCode: null,
            body: null,
            status: function(code) {
              this.statusCode = code;
              return this;
            },
            json: function(data) {
              this.body = data;
              return this;
            }
          };
          
          let nextCalled = false;
          const next = () => { nextCalled = true; };
          
          // Call middleware
          await authenticate(req, res, next);
          
          // Verify 401 response
          expect(res.statusCode).to.equal(401);
          expect(res.body).to.have.property('status', 'fail');
          expect(res.body).to.have.property('message');
          
          // Verify next was NOT called
          expect(nextCalled).to.be.false;
        }
      ),
      { numRuns: 50 }
    );
  });
});
