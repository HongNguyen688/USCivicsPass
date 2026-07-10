import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.uscivicspass.app',
  appName: 'US Civics Pass',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3C3B6E',
      showSpinner: false,
    },
  },
};

export default config;
