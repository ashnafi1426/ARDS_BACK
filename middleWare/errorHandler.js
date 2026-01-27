// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Set the status code (default to 500 if not provided)
  const statusCode = err.status || 500;

  // Send the error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Hide stack trace in production
  });
};

export default errorHandler;