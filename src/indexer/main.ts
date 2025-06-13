import { Indexer } from './indexer';

/**
 * Main entry point for the indexer service.
 * This service is designed to run on an server instance as a standalone service.
 */
async function bootstrap() {
  try {
    console.log('Starting indexer service...');

    const indexer = new Indexer();
    await indexer.initialize();

    console.log('Indexer service started successfully');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received. Shutting down gracefully...');
      await indexer.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received. Shutting down gracefully...');
      await indexer.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting indexer service:', error);
    process.exit(1);
  }
}

// Start the indexer service
bootstrap();
