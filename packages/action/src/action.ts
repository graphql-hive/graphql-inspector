import * as core from '@actions/core';
import { run } from './run.js';

const nodeVersion = process.versions.node;
if (parseInt(nodeVersion.split('.')[0], 10) < 24) {
  throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 24 or higher.`);
}

run().catch(e => {
  core.setFailed(e.message || e);
});
