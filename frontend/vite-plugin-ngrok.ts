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
          let ngrok;
          try {
            ngrok = await import('@ngrok/ngrok');
          } catch (importErr) {
            console.log('\n⚠️  ngrok package not installed. Run: npm install');
            console.log('   Skipping ngrok tunnel - app will work locally only.\n');
            return;
          }

          const port = options.port ?? server.config.server.port ?? 3000;

          // Get authtoken from: 1) options, 2) env var, 3) let SDK find it
          const authtoken = options.authtoken ?? process.env['NGROK_AUTHTOKEN'];

          console.log('\n🚇 Starting ngrok tunnel...');

          // Start the tunnel - only pass authtoken if we have one
          // Otherwise let the SDK read from ngrok config file
          const forwardOptions: { addr: number; authtoken?: string } = { addr: port };
          if (authtoken) {
            forwardOptions.authtoken = authtoken;
          }

          listener = await ngrok.forward(forwardOptions);

          ngrokUrl = (listener as { url: () => string }).url();

          console.log(`✅ ngrok tunnel active: ${ngrokUrl}`);
          console.log(`📋 View in Settings tab or copy from: http://localhost:4040\n`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const errLower = errMsg.toLowerCase();

          console.error('\n❌ Failed to start ngrok tunnel');

          if (errLower.includes('authtoken') || errLower.includes('authentication') || errLower.includes('unauthorized')) {
            console.log('\n   The authtoken may not be configured correctly.');
            console.log('   Options to fix:');
            console.log('   1. Set NGROK_AUTHTOKEN environment variable');
            console.log('   2. Run: ngrok config add-authtoken <your-token>');
            console.log('   Get token at: https://dashboard.ngrok.com/get-started/your-authtoken');
          }

          // Always show the actual error for debugging
          console.log(`\n   Error: ${errMsg}\n`);
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
