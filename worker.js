const { execSync } = require('child_process');

const GH_TOKEN = process.env.GH_TOKEN;
const CODESPACE = process.env.CODESPACE_NAME;
const COMMAND = process.env.COMMAND_TO_RUN;

if (!GH_TOKEN || !CODESPACE || !COMMAND) {
  console.error("❌ Missing required environment variables.");
  process.exit(1);
}

function run(cmd) {
  return execSync(cmd, { stdio: 'inherit', env: { ...process.env, GH_TOKEN } });
}

(async () => {
  console.log(`🟢 Starting codespace: ${CODESPACE}`);
  run(`gh auth login --with-token <<< "${GH_TOKEN}"`);
  run(`gh codespace start -c ${CODESPACE}`);

  console.log(`⏱️ Waiting 45 seconds for boot...`);
  await new Promise(r => setTimeout(r, 45000));

  console.log(`💻 Executing command inside Codespace`);
  run(`gh codespace exec -c ${CODESPACE} -- bash -c "${COMMAND}"`);

  console.log(`⏱️ Waiting 6 minutes...`);
  await new Promise(r => setTimeout(r, 360000));

  console.log(`🔴 Shutting down Codespace...`);
  run(`gh codespace stop -c ${CODESPACE}`);

  console.log(`✅ Done.`);
})();
