import 'dotenv/config';
import { TrustIQServer } from './app';
import { env } from '@trustiq/shared-config';

const server = new TrustIQServer();

const PORT = parseInt(env.API_PORT) || 3001;

async function startServer() {
  try {
    await server.start(PORT);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await server.shutdown();
  process.exit(0);
});

startServer();