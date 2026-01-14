/**
 * Vite plugin to automatically start ngrok tunnel in development mode.
 *
 * Authentication:
 * The @ngrok/ngrok SDK does NOT read from the ngrok CLI config file.
 * You must provide the authtoken via one of these methods:
 *   1. Set NGROK_AUTHTOKEN environment variable (recommended)
 *   2. Pass authtoken directly in plugin options
 *
 * Get your authtoken at: https://dashboard.ngrok.com/get-started/your-authtoken
 */
import type { Plugin } from 'vite';

interface NgrokPluginOptions {
  /** Port to tunnel (defaults to Vite server port) */
  port?: number;
  /** ngrok authtoken - if not provided, uses NGROK_AUTHTOKEN env var */
  authtoken?: string;
  /** Enable/disable ngrok (defaults to true) */
  enabled?: boolean;
}

export function ngrokPlugin(options: NgrokPluginOptions = {}): Plugin {
  const { enabled = true } = options;
  let listener: unknown = null;

  return {
    name: 'vite-plugin-ngrok',
    apply: 'serve', // Only run in dev mode

    async configureServer(server) {
      if (!enabled) return;

      // Wait for server to be listening
      server.httpServer?.once('listening', async () => {
        try {
          // Dynamic import to avoid issues in production builds
          let ngrok;
          try {
            ngrok = await import('@ngrok/ngrok');
          } catch {
            console.log('\n  ngrok package not installed. Run: npm install @ngrok/ngrok');
            console.log('   Skipping ngrok tunnel - app will work locally only.\n');
            return;
          }

          const port = options.port ?? server.config.server.port ?? 3000;

          console.log('\n  Starting ngrok tunnel...');

          // Build forward options
          // The SDK requires explicit authtoken - it does NOT read from ngrok CLI config
          const forwardOptions: {
            addr: number;
            authtoken?: string;
            authtoken_from_env?: boolean;
          } = { addr: port };

          if (options.authtoken) {
            // Explicit authtoken provided in options
            forwardOptions.authtoken = options.authtoken;
          } else {
            // Tell SDK to read from NGROK_AUTHTOKEN env var
            forwardOptions.authtoken_from_env = true;
          }

          listener = await ngrok.forward(forwardOptions);

          const url = (listener as { url: () => string }).url();

          console.log(`  ngrok tunnel active: ${url}`);
          console.log(`   View tunnel status at: http://localhost:4040\n`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);

          console.error('\n  Failed to start ngrok tunnel');

          if (errMsg.includes('authtoken') || errMsg.includes('ERR_NGROK_4018')) {
            console.log('\n   The @ngrok/ngrok SDK requires NGROK_AUTHTOKEN environment variable.');
            console.log('   (Note: The SDK does NOT read from ngrok CLI config file)');
            console.log('\n   To fix:');
            console.log('   1. Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken');
            console.log('   2. Set the environment variable:');
            console.log('      export NGROK_AUTHTOKEN=your_token_here');
            console.log('   3. Or add to your shell profile (~/.zshrc or ~/.bashrc)');
          }

          console.log(`\n   Error: ${errMsg}\n`);
        }
      });
    },

    async closeBundle() {
      // Clean up tunnel on server close
      if (listener && typeof (listener as { close?: () => Promise<void> }).close === 'function') {
        try {
          await (listener as { close: () => Promise<void> }).close();
          console.log('  ngrok tunnel closed');
        } catch {
          // Ignore cleanup errors
        }
      }
    },
  };
}

export default ngrokPlugin;
