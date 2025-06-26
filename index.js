const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const GITHUB_TOKEN = process.env.GH_TOKEN;
const CODESPACE_NAME = process.env.CODESPACE_NAME;

const api = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json'
  }
});

app.get('/run', async (req, res) => {
  if (!GITHUB_TOKEN || !CODESPACE_NAME) {
    return res.status(500).send('❌ Missing environment variables.');
  }

  res.send('✅ Trigger received. Starting codespace.');

  try {
    const list = await api.get('/user/codespaces');
    const cs = list.data.codespaces.find(c => c.name === CODESPACE_NAME);
    if (!cs) throw new Error('Codespace not found.');

    // Step 1: Start Codespace if not running
    if (cs.state !== 'Available') {
      console.log('🟢 Starting Codespace...');
      await api.post(`/user/codespaces/${CODESPACE_NAME}/start`);
    } else {
      console.log('✅ Codespace already running.');
    }

    // Step 2: Wait ~5–6 minutes for your commands to execute
    console.log('⏳ Waiting 7 minutes before stopping...');
    await wait(420000); // 7 minutes

    // Step 3: Shut down Codespace
    console.log('🔴 Stopping Codespace...');
    await api.post(`/user/codespaces/${CODESPACE_NAME}/stop`);

    console.log('✅ Done.');
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.listen(port, () => {
  console.log(`🌐 Server running on port ${port}`);
});
