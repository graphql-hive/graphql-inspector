const { readFileSync, writeFileSync } = require('fs');
const { resolve, join, relative } = require('path');
const { execSync } = require('child_process');
const { exec } = require('shelljs');
const semver = require('semver');
const immer = require('immer').default;
const axios = require('axios').default;

async function main() {
  const placeholder = '0.0.0-PLACEHOLDER';
  const [, , versionOrCanary, nextVersion] = process.argv;
  const rootDir = resolve(__dirname, '../');
  const current = await axios
    .get('https://unpkg.com/@graphql-inspector/core/package.json', {
      responseType: 'json',
    })
    .then(r => r.data.version);

  const isCanary = versionOrCanary === 'canary';
  const isNext = versionOrCanary === 'next';
  const isLatest = !isNext && !isCanary;

  const version = isCanary
    ? `0.0.0-canary.${Math.random().toString(16).substring(2, 9)}`
    : isNext
    ? nextVersion
    : versionOrCanary;

  const packages = getWorkspaces()
    .map(path => join(rootDir, path))
    .filter(name => !name.includes('graphql-cli'));

  const branch = `release/v${version}`;

  if (!semver.valid(version)) {
    throw new Error(`Version ${version} is not valid`);
  }

  if (isLatest) {
    // Create a release branch
    exec(`git checkout -b ${branch}`);
  }

  // Set version in packages
  packages.map(dir => {
    updateString(join(dir, 'package.json'), pkg => pkg.replace(new RegExp(placeholder, 'g'), version));
  });

  if (isLatest) {
    // Bump version in changelog
    updateString(join(rootDir, 'CHANGELOG.md'), changelog =>
      changelog.replace('### vNEXT', `### vNEXT` + '\n\n' + `### v${version}`)
    );
  }

  exec(`yarn build && yarn action && git add action/`);

  const extra = isLatest ? '' : ` --tag ${versionOrCanary}`;
  const cmd = `npm publish ${extra} --access public`;

  // Run npm publish in all libraries
  packages.map(dir => {
    exec(`(cd ${dir} && cd dist && ${cmd})`);
  });

  if (isLatest) {
    // Revert changes in libraries (back to placeholders)
    exec(`git checkout -- ${packages.map(dir => relative(rootDir, dir)).join(' ')}`);

    // Add changes and commit as `Release vX.X.X`
    exec(`git add . && git commit -m "Release v${version}"`);

    // Push the release branch to origin
    exec(`git push origin ${branch}`);

    // Back to master
    exec(`git checkout master`);

    // Remove the release branch
    exec(`git branch -D ${branch}`);
  }

  function updateJSON(filepath, updateFn) {
    const content = readFileSync(filepath, { encoding: 'utf-8' });
    const data = JSON.parse(content);

    const modified = immer(data, updateFn);

    writeFileSync(filepath, JSON.stringify(modified, null, 2), {
      encoding: 'utf-8',
    });
  }

  function updateString(filepath, updateFn) {
    const content = readFileSync(filepath, { encoding: 'utf-8' });

    writeFileSync(filepath, updateFn(content), {
      encoding: 'utf-8',
    });
  }

  function getWorkspaces() {
    const rawInfo = execSync('yarn workspaces info', {
      encoding: 'utf-8',
    });

    const startsAt = rawInfo.indexOf('{');
    const endsAt = rawInfo.lastIndexOf('}');

    const info = JSON.parse(rawInfo.substr(startsAt, endsAt - startsAt + 1));

    return Object.values(info).map(({ location }) => location);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
