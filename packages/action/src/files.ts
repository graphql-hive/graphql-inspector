import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as core from '@actions/core';
import { OctokitInstance } from './types.js';

export function fileLoader({
  octokit,
  owner,
  repo,
}: {
  octokit: OctokitInstance;
  owner: string;
  repo: string;
}) {
  const query = /* GraphQL */ `
    query GetFile($repo: String!, $owner: String!, $expression: String!) {
      repository(name: $repo, owner: $owner) {
        object(expression: $expression) {
          ... on Blob {
            isTruncated
            oid
            text
          }
        }
      }
    }
  `;

  return async function loadFile(file: {
    ref: string;
    path: string;
    workspace?: string;
  }): Promise<string> {
    if (file.workspace) {
      return readFileSync(resolve(file.workspace, file.path), 'utf8');
    }
    const result: any = await octokit.graphql(query, {
      repo,
      owner,
      expression: `${file.ref}:${file.path}`,
    });
    core.info(`Query ${file.ref}:${file.path} from ${owner}/${repo}`);

    try {
      if (result?.repository?.object?.oid && result?.repository?.object?.isTruncated) {
        const oid = result?.repository?.object?.oid;
        const getBlobResponse = await octokit.rest.git.getBlob({
          owner,
          repo,
          file_sha: oid,
        });

        if (getBlobResponse?.data?.content) {
          return Buffer.from(getBlobResponse?.data?.content, 'base64').toString('utf-8');
        }

        throw new Error('getBlobResponse.data.content is null');
      }

      if (result?.repository?.object?.text) {
        if (result?.repository?.object?.isTruncated === false) {
          return result.repository.object.text;
        }

        throw new Error('result.repository.object.text is truncated and oid is null');
      }

      throw new Error('result.repository.object.text is null');
    } catch (error) {
      console.log(result);
      console.error(error);
      throw new Error(`Failed to load '${file.path}' (ref: ${file.ref})`);
    }
  };
}
