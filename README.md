# Stack
Stack is a tool to build and run a stack of applications and infrastructure in Kubernetes. It can be run locally for development, deployed in a shared development environment or deployed to production. Stack handles compiling your code, building Docker images and deploying the code to Kubernetes. 

## Terminology
* Application - Your business code. Usually serving an API, a web site, a consumer or a producer. 
* Infrastructure - Dependencies of your applications. Database, message queue, cache, etc. Some examples: MySQL, Postgres, DynamoDB, RabbitMQ, Kafka, Redis, Memcached. 
* Container - The specification of the Docker image for an application or infrastructure type. For example you could have one container called "node-10" that would be used by all applications running Node.js 10. 
* Global vs private infrastructure. We can create infrastructure that is meant to be shared in the stack, a common example of this is a message bus. Private infrastructure belongs to an application and should not be accessed from other applications.

## Before you get started
### Kubernetes
You need Docker and Kubernetes installed. If you are running MacOS or Windows we recommend using [Docker Desktop](https://www.docker.com/products/docker-desktop) that comes with Kubernetes bundled. You also need to install [`kubectl`](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

### Docker registry
To work with Stack locally you need a Docker registry running. You can start one by using Docker: 

`$ docker run -d -p 5000:5000 --restart=always --name registry registry:2`

https://docs.docker.com/registry/deploying/

## Stack configuration

Your initial directory structure in a stack project will look like this:
```
project-root
   |-package.json            Node.js package.json file that imports stack            
   |-config                  Stack configuration 
   |---stack.yml             The main stack configuration file
   |---apps                  Configuration files for your applications
   |---containers            Configuration files for your Docker containers that will run the applications and infrastructure.
   |-----scripts             Container script for customization of the container build
   |---infrastructure        Configuration files for your global infrastructure
```

### config/apps
This directory contains configuration for the applications in your stack. Each application has its own config file. 

Bellow is an example of what a application config can look like:
```yaml
name: mynodejsservice
container: nodejs10
port: 5001
executable: mynodejsservice.js
path: ./apps/mynodejsservice

environmentVariables:  
  - PORT: ${port}
  - REDIS_HOST: ${infrastructure.mynodejsservice-cache.host}
  - REDIS_PORT: ${infrastructure.mynodejsservice-cache.port}

infrastructure:     # This defines the private infrastructure.
  cache:
    container: redis3
```

### config/containers
There's two different uses of containers, containers for apps and containers for infrastructure. In practice they are the same, you can think about it as infrastructure container runs a 3rd party software while a app container runs our code.

Bellow is an example of the Node.js container referenced in mynodejsservice:
```yaml
name: nodejs10
script: nodejs.js
dockerFile: |+
  FROM node:10-alpine

  RUN apk add --no-cache \
    git \
    curl

  WORKDIR /usr/src/app
  COPY package*.json ./
  RUN npm install
  COPY . .

  ${configOverrides}

  EXPOSE ${port}
  ${env}
  ENTRYPOINT node ${executable}

```


#### containers/scripts
A container script is a Javascript class that will extend the Container class and can override how to generate the Dockerfile. This can be used to set startup arguments to the application, or how to initialize a database with a schema.

`nodejs.js` referenced from the nodejs10 container above:
```javascript
const { Container, Template } = require('stack');

class Nodejs extends Container {
  renderDockerFile(appConfig) {
    const variables = appConfig.resolveVariables();
    variables.env = (appConfig.environment ? `ENV ENVIRONMENT ${appConfig.environment}` : '') + '\n';

    if (appConfig.environmentVariables) {
      appConfig.environmentVariables.forEach(v => {
        const name = Object.keys(v)[0];
        let value = v[name];

        if (typeof value === 'string') {
          value = Template.renderTemplate(value, variables);
        }

        variables.env += `ENV ${name} ${value}\n`;
      });
    }

    return Template.renderTemplate(this.dockerFile, variables);
  }
}

module.exports = Nodejs;

```

### config/infrastructure
This directory contains configuration for global infrastructure that is shared among all apps. One example of shared infrastructure would be Consul or Integration RabbitMQ.

Consul example:
```yaml
name: consul
port: 8500
expose: true
container: consul
```

## Stack usage
```
 $ ./stack 

Usage: stack [command] [options]

  Options:

    --serial                Run commands in serial (default is in parallel)
    --debug                 Print debug output
    --verbose               Be verbose
    --force                 Force the operation
    --registry=local|remote  Use the local (default) or remote Docker registry
    --enable-remote-registry  Check the remote registry before building locally. Disabled by default until Octa/AWS integration is implemented.
    --region=use1           Region to target. Example: use1, usw2
    --with-deps             Run an app command on the app and on all apps it depend on.

  Commands:

    app-deps <app>          Generates a dependency graph for a given app
    build <app>             Build the Docker containers and the Kubernetes specifications.
    clean <app>             Removes all generated config
    commands                Generates a dependency graph of the commands (as a .png)
    deploy <app>            Deploys the application
    deploy-secrets <app>    Deploys the dev secrets to Kubernetes
    deps                    Generates a dependency graph of the applications and services (as a .png)
    dev <app>               Runs an app in local development mode (injects reverse proxy into the Kubernetes cluster)
    dev-ports               Print the local dev ports
    dump-config             dump-config
    expose <app>            Exposes the internal ports of the app on localhost
    get-pods <app>          Returns the pod name(s) that run the service
    help                    Displays usage
    list-images             list images
    logs <app>              Print logs
    restart <app>           Restarts the app
    shell <app>             shell into the application
    status                  Show status of running cluster
    undeploy <app>          Undeploys the application
    undeploy-all            Undeploys the entire stack
    undeploy-secrets <app>  Undeploys the dev secrets to Kubernetes
    unexpose <app>          Exposes the internal ports of the app on localhost
    update <app>            Fetches the latest code of the apps from git
    version <app>           Print the generated version for the app
```
