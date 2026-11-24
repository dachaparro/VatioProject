import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.edu.poli.vatio',
  appName: 'Vatio',
  webDir: 'dist/vatio/browser',
  plugins: {
    LocalNotifications: {
      iconColor: '#3880ff',
    },
  },
};

export default config;
