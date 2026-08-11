import type { CapacitorConfig } from '@capacitor/cli';

// The native shell loads the live web app straight from this origin instead of
// from the bundled copy in dist/. Anything deployed to the web is picked up by
// already-installed apps on next launch — no rebuild, no App Store release.
//
// TRADE-OFF: the app now requires an internet connection. With no network the
// WebView has nothing to load. See the offline note in CLAUDE.md.
const LIVE_URL = 'https://passuscivics.com';

// Escape hatch: build a self-contained, offline-capable app from dist/ instead.
//   CAP_LOCAL=1 npm run build && CAP_LOCAL=1 npx cap sync ios
// Declared inline because the project has no @types/node; the Capacitor CLI
// evaluates this file in Node, so `process` exists at runtime.
declare const process: { env: Record<string, string | undefined> };
const useLocalBundle = Boolean(process.env.CAP_LOCAL);

const config: CapacitorConfig = {
  appId: 'com.uscivicspass.app',
  appName: 'US Civics Pass',
  webDir: 'dist',
  ...(useLocalBundle
    ? {}
    : {
        server: {
          url: LIVE_URL,
          cleartext: false,
        },
      }),
  ios: {
    // Assets still ship inside the .ipa even when pointing at LIVE_URL, so a
    // local build stays one `CAP_LOCAL=1 npx cap sync ios` away.
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3C3B6E',
      showSpinner: false,
    },
  },
};

export default config;
