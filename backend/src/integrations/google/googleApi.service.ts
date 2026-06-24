import axios from 'axios';
import logger from '../../utils/logger';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyeDqlhh8beleGToHBXQgHcnm785z4xZ6sOAlS_5IHrIzZwoYlxg81wnnpbfpHbmxPA/exec';

export class GoogleApiService {
  async fetchAction(action: string): Promise<any> {
    try {
      logger.info(`[GoogleAPI] Fetching action: ${action}`);
      // GAS requires following redirects which axios does by default.
      const response = await axios.get(GAS_URL, {
        params: { action },
      });
      return response.data;
    } catch (error: any) {
      logger.error(`[GoogleAPI] Error fetching action ${action}: ${error.message}`);
      throw error;
    }
  }
}
