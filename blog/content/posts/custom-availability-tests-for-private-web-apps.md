---
title: "How To Run Custom App Insights Availability Tests for Private Web Applications"
date: 2021-06-24T15:54:22Z
draft: true
categories:
- How To
tags:
- azure
- powershell
- azure-functions
- app-insights
- monitoring
---
[Availability Tests](https://docs.microsoft.com/en-us/azure/azure-monitor/app/availability-overview) are a great feature of Azure Application Insights.  They allow you to set up active [black box monitoring](https://sre.google/sre-book/monitoring-distributed-systems/) from points around the world so that you can measure your application's responsiveness and availability from outside of your environment.  There is one snag however: the availability tests originate from hosts on the public internet which means your web app must be exposed for the tests to succeed.  

In this post I'll show you how you can run your own availability tests from a host with access to your application using PowerShell, and then send the results to App Insights using my module [PSCoreAppInsights](https://www.powershellgallery.com/packages/PSCoreAppInsights).  The tests could be run by anything that has the ability to run a PowerShell script, however in this example I'll be using a VNet integrated Azure Function.

All of the code used for this example solution can be found in [this GitHub repo](https://github.com/tommagumma/custom-availability-test-example).

## Setting the scene

I'll be using the scenario outlined in the diagram below to show this example.  We have an Azure Web App connected to a VNet using a private endpoint that we would like to set up Availability Tests for.  Because the application is hosted privately App Insights' testers can't access it - to work around this we have deployed an Azure Function configured with VNet integration which permits it to access the Web App.  This Function App will be running the custom Availability Test and feeding the results back to App Insights.

![design](/images/custom-availability-test-design.png)