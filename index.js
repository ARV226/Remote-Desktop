const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const GITHUB_TOKEN = process.env.GH_TOKEN;
const CODESPACE_NAME = process.env.CODESPACE_NAME;
const COMMAND = process.env.COMMAND_TO_RUN;

const api = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json'
  }
});

app.get('/run', async (req, res) => {
  if (!GITHUB_TOKEN || !CODESPACE_NAME || !COMMAND) {
    return res.status(500).send('❌ Missing environment variables.');
  }

  res.send('✅ Starting Codespace automation — check logs.');

  try {
    // Step 1: List Codespaces to get ID
    const list = await api.get('/user/codespaces');
    const cs = list.data.codespaces.find(c => c.name === CODESPACE_NAME);

    if (!cs) throw new Error('Codespace not found.');

    const id = cs.id;
    console.log(`🔍 Found Codespace: ${id}`);

    // Step 2: If not running, start it
    if (cs.state !== 'Available') {
      console.log('🟢 Starting Codespace...');
      await api.post(`/user/codespaces/${id}/start`);
      await wait(45000); // wait 45 sec for boot
    }

    // Step 3: Run command
    console.log(`💻 Executing command: ${COMMAND}`);
    await api.post(`/user/codespaces/${id}/run-command`, {
      command: COMMAND
    });

    // Step 4: Wait 6 mins
    console.log('⏱️ Waiting 6 minutes...');
    await wait(360000);

    // Step 5: Stop Codespace
    console.log('🔴 Stopping Codespace...');
    await api.post(`/user/codespaces/${id}/stop`);

    console.log('✅ Done.');

  } catch (err) {
    console.error('❌ ERROR:', err.response?.data || err.message);
  }
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.listen(port, () => {
  console.log(`🌐 Server running on port ${port}`);
});
