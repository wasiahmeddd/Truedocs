import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wasi.truedocs',
  appName: 'TrueDocs',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
  },
};

export default config;
