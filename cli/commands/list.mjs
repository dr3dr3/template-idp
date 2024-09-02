import Conf from 'conf';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
// import { z } from 'zod';

const config = new Conf({projectName: 'gitops'});

export async function list () {
    let repoList = config.get('repo-list')
    if (!repoList ) {
        try {
            repoList = [];
            const readUtf8 = (file) => readFileSync(file, 'utf8');
            const repoYaml = await yaml.load(readUtf8('./repo/repositories.yml'));
            repoYaml.repositories.core.map( i => {
                repoList.push({
                    type: 'CORE',
                    name: (i.name).charAt(0).toUpperCase(),
                    repo: i.repo
                })
            })
        } catch (err) {
            console.error( chalk.red.bold('ERROR: Could not read repositories.yml file') );
            console.error(err);
        }


    } else {
        console.log(
            chalk.red.bold('You don\'t have any tasks yet.')
        )
    }
};

//export default list;

export async function add (task) {
    //get the current todo-list
    let todosList = conf.get('todo-list')

    if (!todosList) {
        //default value for todos-list
        todosList = []
    }

    //push the new task to the todos-list
    todosList.push({
        text: task,
        done: false
    })

    //set todos-list in conf
    conf.set('todo-list', todosList)

    //display message to user
    console.log(
        chalk.green.bold('Task has been added successfully!')
    )
}