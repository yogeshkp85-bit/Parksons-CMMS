import fs from 'fs';
import path from 'path';
import { GoogleApiService } from './googleApi.service';

const api = new GoogleApiService();

const ACTIONS_TO_TEST = [
  'getMachineData',
  'getAdminUsers',
  'getHistoricalData',
  'getPending',
  'getCategories',
  'getProblemTypes',
  'getShifts',
  'getSettings',
  'getDepartments'
];

export class GoogleDiscoveryService {
  async runDiscovery() {
    const docsDir = path.resolve(__dirname, '../../../../docs');
    const samplesDir = path.resolve(docsDir, 'google_samples');
    
    if (!fs.existsSync(samplesDir)) {
      fs.mkdirSync(samplesDir, { recursive: true });
    }

    const mappingDocPath = path.resolve(docsDir, 'google_api_mapping.md');
    
    let mdContent = `# Google Apps Script API Mapping\n\n`;
    mdContent += `This document contains the discovered endpoints from the LIVE GAS URL.\n\n`;

    for (const action of ACTIONS_TO_TEST) {
      console.log(`Discovering action: ${action}...`);
      try {
        const response = await api.fetchAction(action);
        
        // Save raw response
        const sampleFilePath = path.join(samplesDir, `${action}.json`);
        fs.writeFileSync(sampleFilePath, JSON.stringify(response, null, 2));

        // Analyze response
        const dataType = typeof response;
        let isArray = Array.isArray(response);
        let columns: string[] = [];

        if (response && response.status === 'success' && response.data) {
          isArray = Array.isArray(response.data);
          if (isArray && response.data.length > 0) {
            // Check if it's an array of objects or array of arrays
            if (Array.isArray(response.data[0])) {
              columns = response.data[0].map(String);
            } else if (typeof response.data[0] === 'object') {
              columns = Object.keys(response.data[0]);
            }
          }
        } else if (isArray && response.length > 0) {
          if (Array.isArray(response[0])) {
            columns = response[0].map(String);
          } else if (typeof response[0] === 'object') {
            columns = Object.keys(response[0]);
          }
        }

        mdContent += `## Action: \`${action}\`\n`;
        mdContent += `- **URL**: \`?action=${action}\`\n`;
        mdContent += `- **Status**: Success\n`;
        mdContent += `- **Response Structure**: ${isArray ? 'Array' : dataType}\n`;
        mdContent += `- **Detected Columns / Fields**: \n`;
        if (columns.length > 0) {
          columns.forEach(col => {
            mdContent += `  - \`${col}\`\n`;
          });
        } else {
          mdContent += `  - *No clear column headers detected or empty data*\n`;
        }
        mdContent += `\n`;

      } catch (err: any) {
        console.error(`Failed action: ${action}`);
        mdContent += `## Action: \`${action}\`\n`;
        mdContent += `- **Status**: Failed\n`;
        mdContent += `- **Error**: ${err.message}\n\n`;
      }
    }

    fs.writeFileSync(mappingDocPath, mdContent);
    console.log(`Discovery complete. Results saved to ${mappingDocPath}`);
  }
}
