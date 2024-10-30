import { registerCommands } from './register-commands.js';
import { registerMetadata } from './register-metadata.js';

const isDevelopment = process.env.NODE_ENV === 'development';

(async () => {
    await registerCommands(isDevelopment);
    await registerMetadata();
})();