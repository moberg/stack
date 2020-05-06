const { spawn } = require('child_process');
const { readFile } = require('fs');
const { homedir } = require('os');
const url = require('url');

const axios = require('axios');
const join = require('url-join');

const getDockerConfig = () => new Promise((resolve, reject) => {
  readFile(`${homedir()}/.docker/config.json`, { encoding: 'utf8' }, (err, data) => {
    if (err && err.code === 'ENOENT') {
      resolve({});
    } else if (err) {
      reject(err);
    } else {
      resolve(JSON.parse(data));
    }
  });
});

async function getAxiosOpts(repository) {
  const dockerConfig = await getDockerConfig();
  const { protocol, hostname } = url.parse(repository);

  // No auth block for this particular registry. Could be local registry.
  if (!(dockerConfig && dockerConfig.auths && dockerConfig.auths[hostname])) {
    return {};
  }

  // There is an auth block for this particular registry, but no registered credential store
  if (!dockerConfig.credsStore) {
    const settings = dockerConfig.auths[hostname];
    if (settings.auth) {
      return { headers: { Authorization: `Basic ${settings.auth}` } };
    }
    console.warn('Unknown/unsupported auth format in ~/.docker/config.json.');
    return {};
  }

  // there is an auth block for this particular registry AND a credential store
  // see https://docs.docker.com/engine/reference/commandline/login/#credentials-store
  const settings = await new Promise((resolve, reject) => {
    const cmd = `docker-credential-${dockerConfig.credsStore}`;
    const cp = spawn(cmd, ['get']);
    const stdout = [];
    const stderr = [];
    let stdoutLen = 0;
    let stderrLen = 0;
    cp.stdout.on('data', (chunk) => { stdout.push(chunk); stdoutLen += chunk.length; });
    cp.stderr.on('data', (chunk) => { stderr.push(chunk); stderrLen += chunk.length; });

    cp.on('close', (code) => {
      if (code === 0) {
        resolve(JSON.parse(Buffer.concat(stdout, stdoutLen)));
      } else {
        const storeOuput = stderrLen
          ? Buffer.concat(stderr, stderrLen) : Buffer.concat(stdout, stdoutLen);
        reject(new Error(`${cmd} exited with code ${code}:\n${storeOuput}. Make sure your Docker registry host and SSL settings are correct.`));
      }
    });

    cp.stdin.write(`${protocol}//${hostname}`);
    cp.stdin.end();
  });

  return { auth: { username: settings.Username, password: settings.Secret } };
}

async function imageExistsInRepository(repository, imageWithTag) {
  const [image, tag] = imageWithTag.split(':');
  const opts = await getAxiosOpts(repository);
  const url2 = join(repository, 'v2', image, 'manifests', tag);

  try {
    await axios.get(`${url2}`, opts);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 404) {
      return false;
    }
    throw e;
  }
}

module.exports = { imageExistsInRepository };
