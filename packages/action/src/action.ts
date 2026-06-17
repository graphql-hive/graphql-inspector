import * as core from '@actions/core';
import { run } from './run.js';

run().catch(e => {
  core.setFailed(e.message || e);
});
