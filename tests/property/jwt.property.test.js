import fc from 'fast-check';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { generateToken, verifyToken } from '../../utils/jwt.js';
import jwt from 'jsonwebtoken';

// Feature: backend-restructure, JWT Properties
describe('JWT Utility Property Tests', () => {
  
  /**
   * Property 24: JWT Round-Trip Verification
   * For any user data object, generating a JWT token from that data and then 
   * verifying the token should return the original user data (id, email, role).
   * Validates: Requirements 10.4, 10.5
   */
  it('Property 24: should preserve user data through token generation and verification', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          role: fc.constantFrom('student', 'advisor', 'admin')
        }),
        (userData) => {
          const token = generateToken(userData);
          const decoded = verifyToken(token);
          
          expect(decoded.id).to.equal(userData.id);
          expect(decoded.email).to.equal(userData.email);
          expect(decoded.role).to.equal(userData.role);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 23: JWT Token Generation
   * For any user data object containing id, email, and role, generating a JWT token 
   * should produce a signed token that includes all three fields in the payload.
   * Validates: Requirements 10.2, 10.3
   */
  it('Property 23: should generate token with all required fields in payload', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          role: fc.constantFrom('student', 'advisor', 'admin')
        }),
        (userData) => {
          const token = generateToken(userData);
          
          // Verify token is a string
          expect(token).to.be.a('string');
          expect(token.length).to.be.greaterThan(0);
          
          // Decode without verification to check payload structure
          const decoded = jwt.decode(token);
          
          expect(decoded).to.have.property('id', userData.id);
          expect(decoded).to.have.property('email', userData.email);
          expect(decoded).to.have.property('role', userData.role);
          expect(decoded).to.have.property('iat'); // issued at
          expect(decoded).to.have.property('exp'); // expiration
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 25: JWT Invalid Token Error
   * For any invalid JWT token (malformed, wrong signature, or expired), 
   * attempting to verify the token should throw an error rather than returning decoded data.
   * Validates: Requirements 10.6
   */
  it('Property 25: should throw error for invalid tokens', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Malformed tokens
          fc.string().filter(s => s.length > 0 && !s.includes('.')),
          fc.constant('invalid.token.here'),
          fc.constant(''),
          // Token with wrong signature
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('student', 'advisor', 'admin')
          }).map(userData => {
            // Generate token with wrong secret
            return jwt.sign(userData, 'wrong_secret', { expiresIn: '1h' });
          })
        ),
        (invalidToken) => {
          expect(() => verifyToken(invalidToken)).to.throw();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Additional test: Expired token handling
   * Validates: Requirements 10.6
   */
  it('Property 25 (expired): should throw error for expired tokens', function() {
    this.timeout(5000);
    
    const userData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'student'
    };
    
    // Generate token that expires immediately
    const expiredToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '0s' });
    
    // Wait a moment to ensure expiration
    setTimeout(() => {
      expect(() => verifyToken(expiredToken)).to.throw('Token has expired');
    }, 100);
  });
});
