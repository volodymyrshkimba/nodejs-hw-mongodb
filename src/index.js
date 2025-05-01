import { setupServer } from './server.js';
import { initMongoConnection } from '../src/db/initMongoConnection.js';
import { createDirIfNotExists } from './utils/createDirIfNotExists.js';
import { TEMP_UPLOAD_DIR } from './constants/index.js';

const bootstrap = async () => {
  await createDirIfNotExists(TEMP_UPLOAD_DIR);
  await initMongoConnection();
  setupServer();
};

bootstrap();
