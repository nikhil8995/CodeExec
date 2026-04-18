// Receives code via argv[2], optional stdin via CE_STDIN env var
const code = process.argv[2] || '';
const stdinData = process.env.CE_STDIN || '';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpFile = path.join(os.tmpdir(), `ce_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
fs.writeFileSync(tmpFile, code);

try {
  const result = execSync(`node "${tmpFile}"`, {
    timeout: 5000,
    encoding: 'utf8',
    input: stdinData,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  process.stdout.write(result);
  process.exit(0);
} catch (e) {
  process.stderr.write(e.stderr || e.message || 'Runtime error');
  process.exit(1);
} finally {
  try { fs.unlinkSync(tmpFile); } catch {}
}
