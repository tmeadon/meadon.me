---
title: "How To Run Custom App Insights Availability Tests for Private Web Applications"
date: 2021-06-24T15:54:22Z
draft: false
tags:
- tech
---

[Availability Tests](https://docs.microsoft.com/en-us/azure/azure-monitor/app/availability-overview) are a great feature of Azure Application Insights.  They allow you to set up active [black box monitoring](https://sre.google/sre-book/monitoring-distributed-systems/) from points around the world so that you can measure your application's responsiveness and availability from outside of your environment.  There is one snag however: the built-in availability tests originate from hosts on the public internet which means your web app must be exposed for the tests to succeed.  

<!--more-->

In this post I'll show you how you can run your own availability tests from a host with access to your application using PowerShell, and then send the results to App Insights using my module [PSCoreAppInsights](https://www.powershellgallery.com/packages/PSCoreAppInsights).  The tests could be run by anything that has the ability to run a PowerShell script, however in this example I'll be using a VNet integrated Azure Function.

All of the code used for this example solution can be found in [this GitHub repo](https://github.com/tmeadon/custom-availability-test-example).

## Setting the scene

I'll be using the scenario outlined in the diagram below to show this example.  We have an Azure Web App connected to a VNet using a private endpoint that we would like to set up Availability Tests for (this could easily be an app hosted on an Azure VM, in your own datacentre etc.).  Because the application is hosted privately, Azure's App Insights testing hosts can't access it - to work around this we have deployed an Azure Function configured with VNet integration which permits it to access the Web App.  This Function App will be running the custom Availability Test and feeding the results back to App Insights.

{{< figure src="/images/custom-availability-test-design.png" alt="solution design diagram" >}}

## Function app

Let's have a look at the Function App which can be found in the `./FunctionApp` directory in the [GitHub repo](https://github.com/tmeadon/custom-availability-test-example).  We have a single function called `RunAvailabilityTest` which is configured with a timer trigger - here's the `function.json` file which defines the trigger:

{{< gist tmeadon 45be49f43884ae49ef582263dec176b6 "function.json" >}}

The `schedule` property contains a cron expression which tells the function to run once every minute - I kept the frequency high because I get impatient when I'm testing :eyes:.  You can change this to whatever frequency is suitable for the web application you're monitoring.  Take a look at the [docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer?tabs=powershell) for more information about this type of trigger.

Next let's look at the `run.ps1` file which contains the actual monitoring code:

{{< gist tmeadon 45be49f43884ae49ef582263dec176b6 "run.ps1" >}}

Firstly we construct the URL of the web application using app's hostname which is passed in using an [environment variable](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-powershell?tabs=portal#environment-variables).  In my example this variable is set dynamically during the infrastructure deployment (using the output of the web app's deployment) however this could equally be set by a pipeline or some other deployment process.

Next we run the test itself.  In my example I am simply using `Invoke-WebRequest` to send an HTTP request to the URL, capturing the result and looking at the status code.  If the status code is between `400` and `599` then the test is marked as failed.  Other methods - such as calling an internal health check API endpoint - may be more appropriate for your web application; the key thing is to store the result of the test as a boolean and (this part's optional) generate a message about the test.  We also need to measure the duration of the test and we can do this by calling `Get-Date` before and after the test to store the start and end times.

Once we have the result of the test we can then use a couple of commands from the `PSCoreAppInsights` module to send the results back to App Insights.  Firstly we create an App Insights client  by running `New-AppInsightsClient` with the instrumentation key passed in via an app setting called `APPINSIGHTS_INSTRUMENTATIONKEY`.  Next we run `Send-AppInsightsAvailability` to send the test result with the following parameters:

- `AppInsightsClient` - the client created initially
- `TestName` - this will be the display name for the test once it gets to App Insights
- `DateTime` - this is the time of the test (I just used the start time captured before executing the test)
- `Duration` - the amount of time the test ran for - I used the `New-TimeSpan` command with the start and end times captured earlier
- `TestRunLocation` - this is where the test is running from - remember that you can run tests against your application from multiple locations, this is the display name for that location.  It could be an Azure region, an on-prem datacentre etc.
- `Success` - a boolean containing the test result
- `Message` - an optional message to send with the test result

When this is up and running you should see something like the screenshot below in the 'Availability' section of your App Insights account:

{{< figure src="/images/availability-test-success-screenshot.png" alt="availability test success screenshot" >}}

Unless there's a problem with your application of course - let's see what happens when I stop the web app:

{{< figure src="/images/availability-test-fail-screenshot.png" alt="availability test fail screenshot" >}}

Notice the drop in availability.  It's up to what you do with this signal - wiring an alert up to fire when the availability drops below a given threshold (determined by your application's service level objectives) would probably be appropriate.

The last thing to point out is how I was able to import the `PSCoreAppInsights` module and use some of its commands.  In this example I used Azure Functions' built-in [dependency management](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-powershell?tabs=portal#dependency-management) system (although I normally prefer to package the dependencies up with the code to prevent slow cold starts - see [here](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-powershell?tabs=portal#custom-modules) for more information).

## Run this for yourself

If you'd like to see this in action you can deploy this example solution into your own Azure subscription - you will need the following:

- An Azure subscription
- An app registration with rights to create Resource Groups and deploy resources in the subscription

1. Fork the example's [GitHub repo](https://github.com/tmeadon/custom-availability-test-example)
2. Create a secret in the new repo called `AZURE_CREDENTIALS` and add the following JSON replacing the values below for your app registration as appropriate:

   ```json
   {
      "clientId": "<GUID>",
      "clientSecret": "<GUID>",
      "subscriptionId": "<GUID>",
      "tenantId": "<GUID>",
   } 
   ```

3. Browse to the 'Actions' tab in the new repo and run a new instance of the 'deploy' workflow.  It will ask you for values for the base name for the resources (this will be the name of the resource group) and for the Azure region for the deployment.  The workflow will do the following:
   - Deploy the bicep templates under `./IaC` which will create a resource group and the various resources
   - Deploy the code in `./FunctionApp` into the new Function App
4. Wait for a few minutes and then check the 'Availability' tab in the new App Insights account - you should see test results coming in

## Alternatives to PowerShell

Of course, PowerShell isn't the only way to send test results back to App Insights.  Here's a [great article](https://dotnetthoughts.net/running-custom-availability-tests-azure-functions/) showing how you can do something similar using C#.  The [Node.js](https://docs.microsoft.com/en-us/azure/azure-monitor/app/nodejs) App Insights APIs should also be able to track availability test results - there's even an (unsupported) [SDK for golang](https://github.com/microsoft/ApplicationInsights-Go).

Availability tests are a great way to implement black box monitoring which is an important component of any monitoring solution - hopefully this example solution will help you to use this tool when your application is hosted in a private network.  Happy monitoring :collision:
