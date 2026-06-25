// Set this to your local host development machine IP address when testing on physical devices or emulator
export const LOCAL_DEV_IP = '10.0.2.2'; // 10.0.2.2 is the default alias to host loopback interface in Android Emulator

export const getApiUrl = (customIp?: string) => {
  const ip = customIp || LOCAL_DEV_IP;
  if (ip.startsWith('http')) {
    return `${ip}/api`;
  }
  return `http://${ip}:5000/api`; // Backend standardized to port 5000
};

export const getSocketUrl = (customIp?: string) => {
  const ip = customIp || LOCAL_DEV_IP;
  if (ip.startsWith('http')) {
    const cleanUrl = ip.replace('/api', '');
    return cleanUrl;
  }
  return `http://${ip}:5000`; // Backend standardized to port 5000
};
