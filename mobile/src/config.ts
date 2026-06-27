import { Platform } from 'react-native';

// Set this to your local host development machine IP address when testing on physical devices or emulator
export const LOCAL_DEV_IP = Platform.OS === 'web' ? 'localhost' : '10.0.2.2'; // 10.0.2.2 is the default alias to host loopback interface in Android Emulator

export const getApiUrl = (customIp?: string) => {
  const ip = customIp || LOCAL_DEV_IP;
  if (ip.startsWith('http')) {
    return `${ip}/api`;
  }
  return `http://${ip}:3001/api`; // Backend runs on port 3001 in local workspace
};

export const getSocketUrl = (customIp?: string) => {
  const ip = customIp || LOCAL_DEV_IP;
  if (ip.startsWith('http')) {
    const cleanUrl = ip.replace('/api', '');
    return cleanUrl;
  }
  return `http://${ip}:3001`; // Backend runs on port 3001 in local workspace
};
