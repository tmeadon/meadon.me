---
title: "Raising Chaos Part 1: Creating and Running Experiments with Azure Chaos Studio"
subtitle: "An explanation of how to configure and run Azure Chaos Studio Experiments using Bicep and the Azure CLI"
description: "An explanation of how to configure and run Azure Chaos Studio Experiments using Bicep and the Azure CLI"
date: 2021-11-26T14:53:48Z
draft: true
tags:
- chaos
- azure
- bicep
---

Wy wife and I live in a small, fairly calm town in the UK and we love it - the peace and quiet suits us perfectly.  That being said, everyone needs a dose of chaos in their lives from time to time, so this weekend I decided to take a look at the preview release of Azure Chaos Studio to find out how I can use it to breach the peace of my Azure deployments 😇

<!--more-->

In this post I will explain how to build a basic Chaos experiment and use it to kick the tyres on a simple Azure deployment.

I'll be using Bicep (if you haven't checked Bicep out yet then I would highly recommend you do so - you can [start here](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview)) to provision a Chaos Studio Experiment as well as the resources which will be the subject of the Experiment.  All of the code can be found in [this GitHub repo](https://github.com/tmeadon/azure-chaos-studio-playground).

{{< admonition type=info >}}
The Azure Chaos Studio service is currently in public preview so it's best you avoid unleashing it on your production environment, for now...
{{< /admonition >}}

## What is Azure Chaos Studio

Azure Chaos Studio is Microsoft's answer to **chaos engineering**, a methodology made popular by Netflix for enhancing the resilience of applications and services, particularly those that are distributed in nature.  According to [principlesofchaos.org](https://principlesofchaos.org/), chaos engineering can be defined as:

> *... the discipline of experimenting on a system in order to build confidence in the system’s capability to withstand turbulent conditions in production.*

The notion is to evaluate the resilience of a system by intentionally injecting faults (such as simulated network failures, or high resource usage conditions) and measuring the effect.  If we observe a negative impact on the system (such as increased HTTP error codes), then we can re-design it to add the necessary reinforcements to protect the it from real-life failures of the same nature.

There are a number of OSS tools available to help you practice chaos engineering, such as [Netflix's Chaos Monkey](https://netflix.github.io/chaosmonkey/) and [LitmusChaos](https://github.com/litmuschaos/litmus), and of course there's nothing stopping you from writing custom scripts to simulate specific failures.  This is where Azure Chaos Studio comes in - it offers a **fully-managed** service which enables you to perform chaos experiments in a safe and controlled way.  Chaos Studio has several important benefits:

- **Integration with Azure Resource Manager** - Chaos Experiments are first-class ARM resources which means they can be managed using ARM templates/Bicep, governed using Azure Policy and RBAC and monitored using Azure Monitor
- **A library of pre-canned faults** - Chaos Studio has a fault library containing a number of faults, you can find the list [here](https://docs.microsoft.com/en-us/azure/chaos-studio/chaos-studio-fault-library) - we can expect this list to grow a lot as this service becomes GA
- **Flexible experiments** - it is possible to build up complex experiments so that you can more accurately replicate real scenarios
- **Controlled execution** - experiments can be easily stopped and rolled back if needed, and there are stringent onboarding and permissions requirements to ensure only authorised resources are targeted

Go and have a look at the [documentation](https://docs.microsoft.com/en-us/azure/chaos-studio/chaos-studio-overview) if you want to find out more about Chaos Studio.  We're going to move on now and look at an example...

## Test Environment

Before we can start causing trouble we need to have something to experiment on.  I decided to use a familiar architecture as a subject for my first experiment - I deployed a pair of web servers running a very basic 'Hello World' Node.js application behind a public load balancer.  The application responds to HTTP requests with a message containing the VM's hostname.

![infrastructure](/images/chaos-part-1-infra.svg)

This infrastructure was deployed using the Bicep files contained in the [iac](https://github.com/tmeadon/azure-chaos-studio-playground/tree/bad-lb-config/iac) directory in the `bad-lb-config` branch of GitHub repo I mentioned earlier.  Why have I used that name for the branch you ask?  It will become apparent later, but the eagle-eyed among you might notice something missing from the load balancer configuration in `lb.bicep`... 😉
