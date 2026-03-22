const app = require('./app');
const config = require('./config/config');
const connectDB = require('./config/database');

let server;

// Start database, then server
connectDB().then(() => {
  server = app.listen(config.port, () => {
    console.log(`Listening to port ${config.port} in ${config.env} mode`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed gracefully');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error('UNEXPECTED ERROR:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      // mongoose.connection.close(false, () => {
      //   console.log('MongoDb connection closed.');
      // });
    });
  }
});
