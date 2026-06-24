import { google } from 'googleapis';
import path from 'path';

async function testAccess() {
  const credentialsPath = 'd:\\Parksons-CMMS-Dev\\credentials.json.json';
  console.log('Testing authentication using:', credentialsPath);

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
    });

    const client = await auth.getClient();
    console.log('✅ Authentication successful! Service account is valid.');

    const drive = google.drive({ version: 'v3', auth });
    console.log('Fetching files accessible by the service account...');
    
    const res = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType)',
    });

    const files = res.data.files;
    if (files && files.length > 0) {
      console.log('✅ The service account has access to the following files:');
      files.forEach((file: any) => {
        console.log(`- ${file.name} (ID: ${file.id})`);
      });
    } else {
      console.log('⚠️ Authentication works, but the service account cannot see any files.');
      console.log('⚠️ Please make sure you have clicked "Share" on your Google Sheet and invited the service account email:');
      console.log('   ide-sheets-bot@sheets-ide-integration.iam.gserviceaccount.com');
    }

  } catch (error: any) {
    console.error('❌ Failed to authenticate or access Drive:');
    console.error(error.message);
  }
}

testAccess();
