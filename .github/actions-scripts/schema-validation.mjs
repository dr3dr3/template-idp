#!/usr/bin/env node

import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import { setOutput, setFailed } from '@actions/core';
import { stringify } from 'querystring';

const repoSchemaCore = z.object({
    name: z.string(),
    repo: z.string(),
    repoDescription: z.string(),
    repoTemplate: z.string(),
    githubPages: z.boolean(),
    gitflow: z.enum(["pull-request","trunk-based-development"]),
    status: z.enum(["active","inactive"])
}).strict();

const repoSchemaSolution = repoSchemaCore.extend({
    groups: z.array(z.string()).nonempty(),
    route: z.string(),
}).strict();

const repoSchemaDeployment = repoSchemaCore.extend({
    host: z.enum(["GITHUB-PAGES","VERCEL","SURGE"]),
}).strict();

const repoSchema = z.object({
    repositories: z.object({
        solutions: repoSchemaSolution.array().nonempty(),
        core: repoSchemaCore.array().length(2),
        deployment: repoSchemaDeployment.array().nonempty(),
    }).strict()
});

const repoVarsSchema = z.object({
    repoVariables: z.object({
        name: z.enum([
            "SOLUTION",
            "SOLN_GROUP",
            "SOLN_DIR",
            "OUTPUT_DIR",
            "SITE_URL",
            "DEPLOY_CI",
            "DEPLOY_BLUE",
            "REPO_GITOPS",
            "REPO_STAGE",
            "REPO_PROD",
            "CHECK_LINKS",
            "ENVIRONMENT"
            ]),
        repo: z.string(),
        value: z.string(),
    }).array()
});

const repoSecretsSchema = z.object({
    repoSecrets: z.object({
        name: z.enum([
            "GITOPS_PAT",
            "CODESPACE_PAT",
            "PIPELINE_PAT"
            ]),
        repo: z.string(),
        expiry: z.date().min(getSecretExpiryCheckDate(), { message: "Secret is about to expire or has expired"}),
    }).array()
});

const repoLabelsSchema = z.object({
    repoLabels: z.object({
        name: z.string(),
        description: z.string(),
        repo: z.string(),
        color: z.enum([
            "bcf5db",
            ]),
    }).array()
});

function getSecretExpiryCheckDate() {
    const now = new Date();
  
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 14,
    );
};

async function main() {

    try {
        const readUtf8 = (file) => readFileSync(file, 'utf8');

        const inputRepo = await yaml.load(readUtf8('./repo/repositories.yml'));
        const isRepoValid = repoSchema.parse(inputRepo);
        console.log(isRepoValid);
        setOutput("result", true);

        const inputRepoVars = await yaml.load(readUtf8('./repo/repo-variables.yml'));
        const isRepoVarsValid = repoVarsSchema.parse(inputRepoVars);
        console.log(isRepoVarsValid);
        setOutput("result", true);

        const inputRepoSecrets = await yaml.load(readUtf8('./repo/repo-secrets.yml'));
        const isRepoSecretsValid = repoSecretsSchema.parse(inputRepoSecrets);
        console.log(isRepoSecretsValid);
        setOutput("result", true);

        const inputRepoLabels = await yaml.load(readUtf8('./repo/repo-labels.yml'));
        const isRepoLabelsValid = repoLabelsSchema.parse(inputRepoLabels);
        console.log(isRepoLabelsValid);
        setOutput("result", true);

        // Check repo names used in valid
        const repoSolutions = inputRepo.repositories.solutions.map( i => i.repo);
        const repoCore = inputRepo.repositories.core.map( i => i.repo);
        const repoDeployment = inputRepo.repositories.deployment.map( i => i.repo);
        const repos = [...repoSolutions, ...repoCore, ...repoDeployment];
        // Check repo names in repo-variables.yml
        const checkVars = inputRepoVars.repoVariables.map( i => {
            const container = {};
            container.repo = i.repo;
            container.check = repos.includes(i.repo);
            if( repos.includes(i.repo) === false ) setFailed(`Repo name not recognised for variable: ${stringify(i)}`);
            return container;
        });
        console.log('REPO VARIABLES CHECK REPO NAME --------------');
        console.log(checkVars);
        // Check repo names in repo-secrets.yml
        const checkSecrets = inputRepoSecrets.repoSecrets.map( i => {
            const container = {};
            container.repo = i.repo;
            container.check = repos.includes(i.repo);
            if( repos.includes(i.repo) === false ) setFailed(`Repo name not recognised for variable: ${stringify(i)}`);
            return container;
        });
        console.log('REPO SECRETS CHECK REPO NAME --------------');
        console.log(checkSecrets)
        // Check repo names in repo-labels.yml
        const checkLabels = inputRepoLabels.repoLabels.map( i => {
            const container = {};
            container.repo = i.repo;
            container.check = repos.includes(i.repo);
            if( repos.includes(i.repo) === false ) setFailed(`Repo name not recognised for variable: ${stringify(i)}`);
            return container;
        });
        console.log('REPO LABELS CHECK REPO NAME --------------');
        console.log(checkLabels)

    } catch (err) {
        setFailed(err.message);
        console.error("Error!!! " + err);
    }; 
};

main();

/*
Test locally:
node .github/actions-scripts/schema-validation.mjs
*/