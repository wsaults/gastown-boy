/**
 * Vite plugin to automatically start ngrok tunnel in development mode.
 * The tunnel URL can be retrieved from the ngrok API at http://127.0.0.1:4040/api/tunnels
 */
import type { Plugin } from 'vite';

interface NgrokPluginOptions {
  /** Port to tunnel (defaults to Vite server port) */
  port?: number;
  /** ngrok authtoken (optional, uses ngrok config if not provided) */
  authtoken?: string;
  /** Enable/disable ngrok (defaults to true) */
  enabled?: boolean;
}

export function ngrokPlugin(options: NgrokPluginOptions = {}): Plugin {
  const { enabled = true } = options;
  let ngrokUrl: string | null = null;
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
          const ngrok = await import('@ngrok/ngrok');

          const port = options.port ?? server.config.server.port ?? 3000;

          console.log('\n🚇 Starting ngrok tunnel...');

          // Start the tunnel
          listener = await ngrok.forward({
            addr: port,
            authtoken: options.authtoken,
          });

          ngrokUrl = (listener as { url: () => string }).url();

          console.log(`✅ ngrok tunnel active: ${ngrokUrl}`);
          console.log(`📋 View in Settings tab or copy from: http://localhost:4040\n`);
        } catch (err) {
          console.error('❌ Failed to start ngrok tunnel:', err);
          console.log('💡 Make sure ngrok is configured: ngrok config add-authtoken <token>\n');
        }
      });
    },

    async closeBundle() {
      // Clean up tunnel on server close
      if (listener && typeof (listener as { close?: () => Promise<void> }).close === 'function') {
        try {
          await (listener as { close: () => Promise<void> }).close();
          console.log('🚇 ngrok tunnel closed');
        } catch {
          // Ignore cleanup errors
        }
      }
    },
  };
}

export default ngrokPlugin;
