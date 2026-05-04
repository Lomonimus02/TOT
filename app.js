const { app, startServer } = require('./server');

startServer().catch((error) => {
    console.error('Passenger startup failed:', error);
    process.exit(1);
});

module.exports = app;