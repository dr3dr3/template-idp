#!/usr/bin/env node

import { getOctokit } from "@actions/github";
import { setOutput, setFailed } from "@actions/core";

console.assert(process.env.GHA_TOKEN, "GHA_TOKEN not present");
console.assert(process.env.REPO_OWNER, "REPO_OWNER not present");
console.assert(process.env.REPO_NAME, "REPO_NAME not present");
console.assert(process.env.VAR_NAME, "VAR_NAME not present");

const octokit = getOctokit(process.env.GHA_TOKEN);

main();

async function getRepoVariables() {

    try {
        const { data:repovar } = await octokit.request('GET /repos/{owner}/{repo}/actions/variables/{name}', {
            owner: process.env.REPO_OWNER,
            repo: process.env.REPO_NAME,
            name: process.env.VAR_NAME,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }});
        console.log( 'getRepoVariable: ' + JSON.stringify(repovar) );
        return repovar.value;
    } catch (err) {
        setFailed(err.message);
        console.error("Error!!! " + err);
    };
};

async function main() {
    const result = await getRepoVariables();
    setOutput("result", result);
};