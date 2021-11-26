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

Wy wife and I live in a small, fairly calm town in the UK and we love it - the peace and quiet suits us perfectly.  That being said, everyone needs a healthy dose of chaos in their lives from time to time, so this weekend I decided to take a look at the preview release of Azure Chaos Studio to find out how I can use it to breach the peace of my Azure deployments 😇

<!--more-->

In this post I will explain how to build a basic Chaos experiment and use it to kick the tyres on a simple Azure deployment using code.

I'll be using Bicep (if you haven't checked Bicep out yet then I would highly recommend you do so - you can [start here](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview)) to provision a Chaos Studio Experiment as well as the resources which will be the subject of the Experiment.  All of the code can be found in [this GitHub repo](https://github.com/tmeadon/azure-chaos-studio-playground).

{{< admonition type=info >}}
The Azure Chaos Studio service is currently in public preview so it's best you avoid unleashing it on your production environment, for now...
{{< /admonition >}}

## What is Azure Chaos Studio

Azure Chaos Studio is Microsoft's answer to **chaos engineering**, a methodology made popular by Netflix for enhancing the resilience of applications and services, particularly those that are distributed in nature.  According to [principlesofchaos.org](https://principlesofchaos.org/), chaos engineering can be defined as:

> *... the discipline of experimenting on a system in order to build confidence in the system’s capability to withstand turbulent conditions in production.*

The notion is to evaluate the resilience of a system by intentionally injecting faults (such as simulated network failures, or high resource usage conditions) and measuring the effect.  If we observe a negative impact on the system (such as increased HTTP error codes), then we can re-design it to add the necessary reinforcements to protect the it from real-life failures of the same nature.

