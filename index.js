const express = require('express');
const { execSync } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

const GH_TOKEN = process.env.GH_TOKEN;
const CODESPACE = process.env.CODESPACE_NAME;
const COMMAND = process.env.COMMAND_TO_RUN;

function run(cmd) {
  return execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, GH_TOKEN }
  });
}

app.get('/run', async (req, res) => {
  if (!GH_TOKEN || !CODESPACE || !COMMAND) {
    res.status(500).send("Missing required environment variables.");
    return;
  }

  res.send('✅ Codespace operation started. Check Render logs.');

  try {
    console.log(`🟢 Logging in to GitHub`);
run(`echo "${GH_TOKEN}" | gh auth login --with-token`);
    
    console.log(`🟢 Starting Codespace: ${CODESPACE}`);
    run(`gh codespace start -c ${CODESPACE}`);

    console.log(`⏱️ Waiting 45 seconds`);
    await new Promise(r => setTimeout(r, 45000));

    console.log(`💻 Executing inside Codespace`);
    run(`gh codespace exec -c ${CODESPACE} -- bash -c "${COMMAND}"`);

    console.log(`⏱️ Waiting 6 minutes`);
    await new Promise(r => setTimeout(r, 360000));

    console.log(`🔴 Shutting down Codespace`);
    run(`gh codespace stop -c ${CODESPACE}`);

    console.log(`✅ Done.`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
});

app.listen(port, () => {
  console.log(`🖥️ Server running on port ${port}`);
});
