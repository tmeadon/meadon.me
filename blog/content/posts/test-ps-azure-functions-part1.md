---
title: "Testing PowerShell Azure Functions Part 1: Unit testing"
date: 2020-11-08T10:48:01Z
draft: true
series: "Testing PowerShell Azure Functions"
---
Azure Functions provide a great way to run your PowerShell code, but how can you be sure that what you have built does what you intended it to do? Can you guarantee that the functionality you have built won't break when you or someone else adds or makes changes to the code at a later date?

The answer is yes - with testing!  This 3 part series explains some of the ways that we can test PowerShell Azure Functions, covering unit testing, integration testing and finally test automation.  For this article we'll starting at the bottom of the [Testing Pyramid](https://automationpanda.com/2018/08/01/the-testing-pyramid/) - with unit tests.

## Unit tests - what, how and why?

What are unit tests?  Well, for a start, I'm not going to pretend to be able to offer the best explanation on the web - for a more detailed explanation I would recommend going over to [softwaretestingfundamentals.com](https://softwaretestingfundamentals.com/unit-testing/) or [edureka.co](https://www.edureka.co/blog/what-is-unit-testing) who both have good articles on the topic.  To summarise though, unit testing is about breaking your code down into the smallest possible pieces of logic (i.e. 'units') and validating each one does what it is supposed to do in complete isolation.  This is normally done by executing each unit (usually functions or methods) with a sample input and checking the output against what you would expect it to be.  For unit tests to be really effective they need to be simple, fast and ideally small; the more granular your tests are the easier it is to see exactly what's broken.  This does add an onus on the code however: it needs to be written in such a way that allows you to write small tests and truly isolate each piece of logic from other external and internal dependencies.  We'll cover that in the next section.  The importance of unit tests pretty much speaks for itself - how can you think about starting to piece your code together into a larger application if you're not sure each individual piece works on its own?

That covers the 'what' and the 'why' but what about the 'how'?  Well if you're not familiar with [Pester](https://pester.dev/) then you should know that it is the de facto standard testing and mocking framework for PowerShell - we'll be using Pester v5 in the examples in this series to write and run our tests.

## Writing testable code

As I mentioned in the last section, in order to write good unit tests, we need to write out code in a way that allows us to do so.  To effectively test each unit of logic in isolation, our code needs to be broken up into the units that we want to test.  What that means for us in the PowerShell world is that where we might have ordinarily stitched various bits of logic together into a single script (or large function), we should instead wrap each piece in its own smaller function (which become our testable units) and call it from our main script/function.

In order to apply this to a PowerShell Azure Functions project we'll need to overcome a challenge almost immediately.  When we create a new Functions project (in the Azure Portal or locally), we'll be presented with a boilerplate project template that looks something like this (also available [here](https://github.com/tommagumma/ps-func-testing/tree/ec9a02a4625af4dbeefd831a6fcb8cba8ae44ced/FunctionApp)):

```text
\---FunctionApp
    |   .gitignore
    |   host.json
    |   local.settings.json
    |   profile.ps1
    |   requirements.psd1
    |
    \---HttpTrigger
            function.json
            run.ps1
```

By default our Functions will just run whatever they find in the `run.ps1` file in their Function directories, so where do we define our individual functions?  We could add them to `run.ps1` but doing so would pose a challenge for Pester: Pester needs to load the functions before it can test them by dot sourcing their containing file, and dot sourcing `run.ps1` would run the script itself - not ideal!

An alternative, and recommended, option is to make use of the [Function app-level `Modules` folder](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-powershell?tabs=portal#function-app-level-modules-folder).  Any PowerShell modules located in this special directory will be loaded at startup and will be available to our Functions.  This will allow us to define our individual units in our own module (something we're probably quite familiar with) and simply call them in our `run.ps1`.  With this approach we can test our separate pieces of logic in isolation and then just verify that `run.ps1` invokes each one correctly.

Here's what the directory structure will become:

```text
\---FunctionApp
    |   .gitignore
    |   host.json
    |   local.settings.json
    |   profile.ps1
    |   requirements.psd1
    |
    +---HttpTrigger
    |       function.json
    |       run.ps1
    |
    \---Modules
            CustomModule.psm1
```


## Testing a basic HTTP Function

