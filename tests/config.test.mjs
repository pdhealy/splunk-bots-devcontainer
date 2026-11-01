import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const services = {
  bots1: { manifest: 'botsv1', port: '8000' },
  bots2: { manifest: 'botsv2', port: '8020' },
  bots3: { manifest: 'botsv3', port: '8030' },
};

const compose = readFileSync('docker-compose.yml', 'utf8');

test('each BOTS service uses its dedicated app manifest and selectable platform', () => {
  for (const [service, { manifest, port }] of Object.entries(services)) {
    const section = compose.split(new RegExp(`^  ${service}:`, 'm'))[1].split(/^  \S/m)[0];
    assert.match(section, /platform: "\$\{SPLUNK_PLATFORM:-\}"/);
    assert.match(section, new RegExp(`- config/${manifest}\\.env`));
    assert.match(section, new RegExp(`- "${port}:8000"`));

    const appList = readFileSync(`config/${manifest}.env`, 'utf8').trim();
    assert.match(appList, /^SPLUNK_APPS_URL=\/tmp\/apps\//);
    assert.ok(appList.split(',').length > 1, `${manifest} must contain multiple apps`);
  }
});

test('Dev Container selects a BOTS service from the local environment', () => {
  const config = JSON.parse(readFileSync('.devcontainer/devcontainer.json', 'utf8'));
  const lock = JSON.parse(readFileSync('.devcontainer/devcontainer-lock.json', 'utf8'));

  assert.equal(config.service, 'workspace');
  assert.deepEqual(config.runServices, ['${localEnv:BOTS_SERVICE:bots1}']);
  assert.deepEqual(config.forwardPorts, [8000, 8020, 8030]);

  for (const feature of Object.keys(config.features)) {
    assert.ok(lock.features[feature], `lockfile is missing ${feature}`);
  }
});

test('launch wrappers reject invalid service and platform values', () => {
  const invalidService = spawnSync('./scripts/devcontainer-up', [], {
    encoding: 'utf8',
    env: { ...process.env, BOTS_SERVICE: 'invalid' },
  });
  assert.equal(invalidService.status, 64);
  assert.match(invalidService.stderr, /BOTS_SERVICE must be/);

  const invalidPlatform = spawnSync('./scripts/bots-compose', ['bots1', 'up'], {
    encoding: 'utf8',
    env: { ...process.env, SPLUNK_PLATFORM: 'invalid' },
  });
  assert.equal(invalidPlatform.status, 64);
  assert.match(invalidPlatform.stderr, /Unsupported SPLUNK_PLATFORM/);
});

const dockerAvailable = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' }).status === 0;
test('Docker Compose renders the complete configuration', { skip: !dockerAvailable }, () => {
  execFileSync('docker', ['compose', 'config', '--quiet'], { stdio: 'inherit' });
  execFileSync('docker', ['compose', 'config', '--quiet'], {
    stdio: 'inherit',
    env: { ...process.env, SPLUNK_PLATFORM: 'linux/amd64' },
  });
});
