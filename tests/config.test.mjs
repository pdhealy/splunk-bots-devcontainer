import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const services = {
  bots1: { manifest: 'botsv1', port: '8000' },
  bots2: { manifest: 'botsv2', port: '8020', dataset: '/data/botsv2_data_set_attack_only.tgz' },
  bots3: { manifest: 'botsv3', port: '8030', dataset: '/data/botsv3_data_set.tgz' },
};

const image = 'splunk/splunk@sha256:d4c095d0971fe6054b9b19502019bf54f79c3013726d54ed70e12ad281f5731f';
const dockerAvailable = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' }).status === 0;

function renderCompose(env = {}) {
  const result = spawnSync('docker', ['compose', 'config', '--format', 'json'], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function hasReadOnlyBindMount(config, source, target) {
  return config.volumes.some((volume) => {
    if (typeof volume === 'string') {
      return volume === `${source}:${target}:ro`;
    }

    return volume.type === 'bind'
      && volume.source === source
      && volume.target === target
      && (volume.read_only === true || volume.readOnly === true);
  });
}

function hasPublishedPort(config, published) {
  return config.ports.some((port) => {
    if (typeof port === 'string') {
      return port === `${published}:8000`;
    }

    return port.target === 8000 && String(port.published) === published;
  });
}

function hasEnvFile(config, expectedPath, expectedRequired) {
  return config.env_file.some((entry) => {
    if (typeof entry === 'string') {
      return (entry === expectedPath || entry.endsWith(`/${expectedPath}`)) && expectedRequired !== false;
    }

    return (entry.path === expectedPath || entry.path.endsWith(`/${expectedPath}`))
      && entry.required === expectedRequired;
  });
}

test('rendered Compose configuration isolates and hardens BOTS services', { skip: !dockerAvailable }, () => {
  const compose = renderCompose();
  const amd64Compose = renderCompose({ SPLUNK_PLATFORM: 'linux/amd64' });

  for (const [service, { manifest, port, dataset }] of Object.entries(services)) {
    const config = compose.services[service];
    assert.equal(config.image, image);
    assert.equal(config.container_name, undefined);
    assert.deepEqual(config.healthcheck.test, ['CMD-SHELL', '/opt/splunk/bin/splunk status >/dev/null 2>&1']);
    assert.equal(config.healthcheck.interval, '10s');
    assert.equal(config.healthcheck.timeout, '5s');
    assert.equal(config.healthcheck.retries, 120);
    assert.match(config.healthcheck.start_period, /^1m(?:0s)?$/);
    assert.ok(hasReadOnlyBindMount(config, `${process.cwd()}/apps/${manifest}`, '/tmp/apps'));
    assert.ok(hasEnvFile(config, 'config/.env', true));
    assert.ok(hasEnvFile(config, `config/bots/${manifest}.env`, true));
    assert.ok(hasPublishedPort(config, port));
    assert.equal(amd64Compose.services[service].platform, 'linux/amd64');

    const appList = readFileSync(`config/bots/${manifest}.env`, 'utf8').trim();
    assert.match(appList, /^SPLUNK_APPS_URL=\/tmp\/apps\//);
    assert.ok(appList.split(',').length > 1, `${manifest} must contain multiple apps`);

    if (dataset) {
      assert.ok(hasReadOnlyBindMount(config, `${process.cwd()}/data`, '/data'));
      assert.ok(appList.endsWith(dataset), `${manifest} must use a local dataset archive`);
      assert.doesNotMatch(appList, /https?:\/\//);
    }
  }
});

test('local Splunk configuration is ignored without a template file', () => {
  assert.match(readFileSync('.gitignore', 'utf8'), /^config\/\.env$/m);
  assert.match(readFileSync('.gitattributes', 'utf8'), /^config\/\.env export-ignore$/m);
  assert.equal(existsSync('config/.env.example'), false);
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
