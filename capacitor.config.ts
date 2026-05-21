import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'med.appsell.store',
  appName: 'Medianeira App',
  webDir: 'www',
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true,
    }
  }
};

export default config;
