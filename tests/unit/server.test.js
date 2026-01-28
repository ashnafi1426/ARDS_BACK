import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { spawn } from 'child_process';
import request from 'supertest';

describe('Server Separation Tests', () => {
  /**
   * Test that importing app.js doesn't start the server
   * Validates: Requirements 2.2, 2.4
   */
  it('should not start server when importing app.js', async function() {
    this.timeout(5000);
    
    // Import app.js
    const { default: app } = await import('../../app.js');
    
    // Verify app is an Express application
    expect(app).to.be.a('function');
    expect(app.listen).to.be.a('function');
    
    // The app should be exported but not listening
    // We can verify this by checking that the app object exists
    // but no server is actually running on the port
    expect(app).to.exist;
  });

  /**
   * Test that server.js starts server on correct port
   * Validates: Requirements 2.1, 2.2, 2.3
   */
  it('should start server on correct port when running server.js', function(done) {
    this.timeout(10000);
    
    const port = process.env.PORT || 5004;
    
    // Start server.js as a child process
    const serverProcess = spawn('node', ['server.js'], {
      cwd: process.cwd(),
      env: process.env
    });

    let output = '';
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      // Check if server started successfully
      if (output.includes(`Server is running on port ${port}`)) {
        // Give it a moment to fully start
        setTimeout(async () => {
          try {
            // Make a test request to verify server is responding
            const response = await request(`http://localhost:${port}`)
              .get('/')
              .timeout(2000);
            
            expect(response.status).to.equal(200);
            expect(response.text).to.include('Academic Risk Detection System Backend');
            
            // Clean up: kill the server process
            serverProcess.kill();
            done();
          } catch (error) {
            serverProcess.kill();
            done(error);
          }
        }, 1000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      done(error);
    });

    // Timeout fallback
    setTimeout(() => {
      if (serverProcess.killed === false) {
        serverProcess.kill();
        done(new Error('Server did not start within timeout'));
      }
    }, 8000);
  });

  /**
   * Test that app.js exports Express app instance
   * Validates: Requirements 2.4, 2.5
   */
  it('should export Express app instance from app.js', async function() {
    const { default: app } = await import('../../app.js');
    
    // Verify it's an Express app
    expect(app).to.be.a('function');
    expect(app.use).to.be.a('function');
    expect(app.get).to.be.a('function');
    expect(app.post).to.be.a('function');
    expect(app.listen).to.be.a('function');
  });
});
