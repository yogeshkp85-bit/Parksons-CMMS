import { GoogleDiscoveryService } from './src/integrations/google/googleDiscovery.service';

const discovery = new GoogleDiscoveryService();
discovery.runDiscovery().then(() => {
  console.log('Discovery done.');
}).catch(console.error);
