---
title: "Raising Chaos Part 2: Automating Chaos Experiments with GitHub Actions"
subtitle: "How to add resiliency testing to your CI/CD process using Azure Chaos Studio, GitHub Actions and k6"
description: "How to add resiliency testing to your CI/CD process using Azure Chaos Studio, GitHub Actions and k6"
date: 2022-01-06T14:53:48Z
draft: true
tags:
- chaos
- azure
- bicep
- k6
toc:
  auto: false
images:
- /images/chaos-part-1-featured.png
featuredImage: /images/chaos-part-1-featured.png
---

In [part 1](https://blog.meadon.me/chaos-studio-part-1/) of this mini series I talked about some of the basics of Chaos Engineering and how Azure Chaos Studio can be used to perform experiments in a reliable, repeatable and safe manner.  In this blog post I'll be looking at how to automate the execution and observation of the experiment I created previously to enable us to add regular resiliency testing to our development lifecycle.  

<!--more-->

By including resiliency testing in our CI/CD pipeline we can increase the chance of catching changes that will degrade our system's resiliency before they are released to production.  It is common to perform end-to-end tests, load tests, stress tests and security tests before releasing changes to a system and resiliency testing is another great string to add to your bow.

In this post I'll be building upon the same [GitHub repo](https://github.com/tmeadon/azure-chaos-studio-playground) as [part 1](https://blog.meadon.me/chaos-studio-part-1/) - you'll find all the code discussed in this article in there.

## The Tools

In the previous post I demonstrated how to build Azure Chaos Studio using Bicep and how to observe the effect of the experiment using PowerShell.  In this post I'll be adding a couple of tools to the belt: GitHub Actions and k6.

### GitHub Actions

In the unlikely event of you not being aware of what GitHub Actions are then I'd recommend you visit [github.com](https://github.com/features/actions) to find out more.  I'll be using GitHub Actions to build a pipeline (or "Workflow" using GitHub's lingo) that deploys an instance of my test infrastructure (see [The Test Environment](https://blog.meadon.me/chaos-studio-part-1/#the-test-environment) for a reminder on what this looks like), initiates my Azure Chaos Studio experiment and then runs a load test to observe the effect of the experiment.

### k6

[k6](https://k6.io/) is an open source load testing tool which can execute tests written in JavaScript.  It allows you to define checks and thresholds which can be used to set pass/fail criteria on test executions.  We'll be using k6 to observe the results of the chaos experiment and report the result back to the GitHub Actions workflow.  In [part 1](https://blog.meadon.me/chaos-studio-part-1/#running-the-experiment) I used a small piece of PowerShell for this which was great for quick interactive testing - I decided to replace this with k6 rather than having to write the threshold and reporting logic myself.

k6 have a [GitHub Action](https://github.com/grafana/k6-action) available too which will make running the test in the workflow very simple to configure.

## Building the Workflow

I decided to split my workflow up into two jobs: one for deploying the infrastructure and another (dependant on the first) for executing the tests - honestly I don't have a good reason for doing this other than it seeming like a neat way to organise the various steps... 🤷‍♂️

To start the Workflow I created `.github/workflows/chaos-tests.yml` (you can find the full Workflow [here](https://github.com/tmeadon/azure-chaos-studio-playground/blob/main/.github/workflows/chaos-tests.yml)) and added the following initial code which gives the Workflow a name, adds a `workflow_dispatch` trigger and defines some basic environment variables used for resource naming:

```yaml
name: chaos-tests

on: 
  workflow_dispatch:

env:
  loadBalancerPipName: lb-pip
  disconnectExperimentName: half-vm-disconnect
  resourceGroupName: chaos-playground
    
jobs:
```

### Building the Deployment Job

The next step was to add a job containing the steps for deploying an instance of my test infrastructure using the Bicep templates.  Before our Workflow can think about deploying anything to Azure, it will need to authenticate and get request an access token to use to initiate the deployment.  This requires creating an Azure AD service principal and storing its details in a repository secret - I followed the instructions [found here](https://github.com/marketplace/actions/azure-login#configure-a-service-principal-with-a-secret) to do this.  With that in place I could add a step calling the `azure/login@v1` Action to authenticate the Workflow using the credentials.

My Bicep deployment requires the admin password for the VMs to be passed in as a parameter, so I also added a repository secret called `VM_ADMIN_PASSWORD`.

With authentication and admin password taken care of, deploying the Bicep is a simple case of running the Azure CLI command `az deployment sub create -l uksouth -f ./iac/main.bicep -p adminPassword=${{ secrets.VM_ADMIN_PASSWORD }}`.  

Since this deployment is transient there's no way to know in advance what the public IP address of the load balancer will be, and this is crucial information for the k6 test (it needs to know where to send HTTP requests right..?) - I added a couple of commands to run after the deployment to capture this and expose it using a job output.  See [GitHub's documentation](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idoutputs) for more information about job outputs.

The code for this job is as follows:

```yaml
  deploy:
    runs-on: ubuntu-latest
    outputs:
      publicIp: ${{ steps.deploy-bicep.outputs.publicIp}}
    steps:
      - uses: actions/checkout@v2

      - name: Azure login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy bicep
        id: deploy-bicep
        uses: azure/CLI@v1
        with:
          inlineScript: |
            az deployment sub create -l uksouth -f ./iac/main.bicep -p adminPassword=${{ secrets.VM_ADMIN_PASSWORD }}
            pip=$(az network public-ip show -n $loadBalancerPipName -g $resourceGroupName --query ipAddress -o tsv)
            echo "::set-output name=publicIp::$pip"
```

