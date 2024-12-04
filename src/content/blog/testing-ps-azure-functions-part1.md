---
title: "Testing PowerShell Azure Functions Part 1: Unit testing"
pubDate: 2020-11-08T10:48:01Z
draft: true
---

Azure Functions provide a great way to run your PowerShell code, but how can you be sure that what you have built does what you intended it to do? Can you guarantee that the functionality you have built won't break when you or someone else adds or makes changes to the code at a later date?

The answer is yes - with testing! This 3 part series explains some of the ways that we can test PowerShell Azure Functions, covering unit testing, integration testing and finally test automation. For this article we'll starting at the bottom of the [Testing Pyramid](https://automationpanda.com/2018/08/01/the-testing-pyramid/) - with unit tests.

All of the code used in this blog series can be found in [this GitHub repository](https://github.com/tmeadon/ps-func-testing).

## Unit tests - what, how and why?

What are unit tests? Well, for a start, I'm not going to pretend to be able to offer the best explanation on the web - for a more detailed explanation I would recommend going over to [softwaretestingfundamentals.com](https://softwaretestingfundamentals.com/unit-testing/) or [edureka.co](https://www.edureka.co/blog/what-is-unit-testing) who both have good articles on the topic. To summarise though, unit testing is about breaking your code down into the smallest possible pieces of logic (i.e. 'units') and validating each one does what it is supposed to do in complete isolation. This is normally done by executing each unit (usually functions or methods) with a sample input and checking the output against what you would expect it to be. For unit tests to be really effective they need to be simple, fast and ideally small; the more granular your tests are the easier it is to see exactly what's broken. This does add an onus on the code however: it needs to be written in such a way that allows you to write small tests and truly isolate each piece of logic from other external and internal dependencies. We'll cover that in the next section. The importance of unit tests pretty much speaks for itself - how can you think about starting to piece your code together into a larger application if you're not sure each individual piece works on its own?

That covers the 'what' and the 'why' but what about the 'how'? Well if you're not familiar with [Pester](https://pester.dev/) then you should know that it is the de facto standard testing and mocking framework for PowerShell - we'll be using Pester v5 in the examples in this series to write and run our tests.

## Writing testable code

As I mentioned in the last section, in order to write good unit tests we need to write our code in a way that allows us to do so. To effectively test each unit of logic in isolation our code needs to be broken up into the units that we want to test. What that means for us in the PowerShell world is that where we might have ordinarily stitched various bits of logic together into a single script (or large function), we should instead wrap each piece in their own smaller functions (which become our testable units) and in turn call them from our main script/function.

In order to apply this to a PowerShell Azure Functions project we'll need to overcome a challenge almost immediately. When we create a new Functions project (in the Azure Portal or locally), we'll be presented with a boilerplate project template that looks something like this (also available [here](https://github.com/tmeadon/ps-func-testing/tree/ec9a02a4625af4dbeefd831a6fcb8cba8ae44ced/FunctionApp)):

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

By default our Functions will just run whatever they find in the `run.ps1` file in their Function directories, so where do we define our individual functions? We could add them to `run.ps1` but doing so would pose a challenge for Pester: Pester needs to load the functions before it can test them by dot sourcing their containing file, and dot sourcing `run.ps1` would run the script itself - not ideal!

An alternative, and recommended, option is to make use of the [Function app-level `Modules` folder](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-powershell?tabs=portal#function-app-level-modules-folder). Any PowerShell modules located in this special directory will be loaded at startup and will be available to our Functions. This will allow us to define our individual units in our own module (something we're probably quite familiar with) and simply call them in our `run.ps1`. With this approach we can test our separate pieces of logic in isolation and then just verify that `run.ps1` invokes each one correctly.

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

Let's take a look at how we can put this into practice. Consider an HTTP Function that uses the [REST countries](https://restcountries.eu/) API to return the name, capital city, region and subregion of different countries based on an optional query string parameter. If the parameter `NameSearch` is supplied then it returns the countries whose names the supplied search term, if not then it picks a country at random. We _could_ write all of the logic in the Function's `run.ps1` (as seen [here](https://github.com/tmeadon/ps-func-testing/blob/73bdad9e52468b6394ee193c4430e1d5b2dd689d/FunctionApp/Countries/run.ps1)), but as we know, that wouldn't be very helpful. Instead, we can write a few simple functions (`Search-CountryName`, `Get-RandomCountry` and `New-FunctionOutput`) in a module file under the `Modules` directory (like [this](https://github.com/tmeadon/ps-func-testing/blob/main/FunctionApp/Modules/Countries/countries.psm1)) and re-write `run.ps1` ([as so](https://github.com/tmeadon/ps-func-testing/blob/main/FunctionApp/Countries/run.ps1)).

### Testing the module functions

Before we can write any tests for our functions we'll need to think about how we're going to isolate them. `Search-CountryName` and `Get-RandomCountry` are both dependant on the countries API, so we'll need to create a mock for the command we use to communicate with it (`Invoke-RestMethod`) so that we can fake the API's response. For more information on what mocks are and how they work with Pester see [the Pester docs](https://pester.dev/docs/usage/mocking). We will need to give Pester some data to output from the mock so that we can fake the API as closely as possible; I've tackled that by taking a sample response from the API, storing it in [some JSON](https://github.com/tmeadon/ps-func-testing/blob/main/tests/example-api-response.json) and importing it at runtime. We can use a similar approach to tell Pester what it should expect to get back from our `New-FunctionOutput` function.

We should be able to write some tests now, so let's set up our tests file by adding a `Describe` block (which will contain all of our tests) and a `Context` block (which will contain the module tests).

```powershell
Describe "Countries Tests" {
    Context "Test countries module" {

    }
}
```

Next, we need to add a `BeforeAll` block to the `Context` block and add to it some setup steps such as loading the module (i.e. our test subject), loading our example data and creating our mocks:

```powershell
Describe "Countries Tests" {
    Context "Test countries module" {
        BeforeAll {
            # reload the module
            Get-Module -Name "countries" | Remove-Module
            Import-Module -Name (Join-Path -Path (Get-Item -Path $PSScriptRoot).Parent -ChildPath "FunctionApp\Modules\Countries")

            # load example api response and function output
            $exampleResponse = Get-Content -Path "$PSScriptRoot\example-api-response.json" | ConvertFrom-Json
            $expectedOutput = Get-Content -Path "$PSScriptRoot\example-function-output.json" | ConvertFrom-Json

            # create a mock for Invoke-RestMethod that returns the example response
            Mock -CommandName 'Invoke-RestMethod' -MockWith { $exampleResponse }

            # create a mock for Get-Random that just returns the first item in $InputObject
            Mock -CommandName 'Get-Random' -MockWith { $InputObject[0] }

            # store the countries api base uri
            $baseUri = "https://restcountries.eu/rest/v2"
        }
    }
}
```

Alongside the mock for `Invoke-RestMethod` I've also created one for `Get-Random` which simply returns the first item in the supplied list (we like things to be deterministic when we're testing them :smiley:). Finally I've also stored the base URI for the countries API in a variable which we'll re-use later.

Now for the tests - here's are the things we need to verify (you can find the implementation for each of these checks [here](https://github.com/tmeadon/ps-func-testing/blob/49dd4043b50c89963d4a41ae805efb6038250c07/tests/Countries.tests.ps1#L26-L46)):

- `Search-CountryName`
  - It should return our example response as-is
  - It should call the correct URL (we can do this by checking if our mock was called with the correct parameters)
- `Get-RandomCountry`
  - It should return the first item in our example response (thanks to our `Get-Random` mock)
  - It should call the correct URL
- `New-FunctionOutput`
  - It should correctly convert our example response to our example output (we can check this by converting both to JSON and performing a string comparison)

### Testing the Function itself

Now we know that our individual bits of logic are working as expected we can move on to validating our Function itself. As we know, the Function comprises of `run.ps1` which is run on each Function invocation and `function.json` which holds important configuration information, such as the Function's bindings. We'll need to test that the Function calls our module functions correctly and that the bindings are configured as they should be.

As we did when we prepared for testing our module functions, we'll need to think about how we're going to isolate the code in `run.ps1`. To respond to HTTP requests our Function needs to pass an `HttpResponseContext` object (which sets the status code and body of the response) into a special command called `Push-OutputBinding`. Unfortunately this command and the `HttpResponseContext` type are injected into the Functions runtime by the [Azure Functions PowerShell Worker](https://github.com/Azure/azure-functions-powershell-worker) which means they're not available to Pester by default, and Pester needs to know about a command before it can create a mock for it. To get over that hurdle we can define some stubs which we can load at runtime - you can see an example of that [here](https://github.com/tmeadon/ps-func-testing/blob/main/tests/functions-stubs.ps1).

Input?

Like above, let's create a new `Context` block and add to it a `BeforeAll` block with some setup (including dot sourcing our stubs file, storing some variables that we'll need later in the tests and creating some mocks for our module functions as well as `Push-OutputBinding`):

```powershell
Context "Test Function" {
    BeforeAll {
        # load functions runtime stubs
        . "$PSScriptRoot\functions-stubs.ps1"

        # store some variables
        $scriptPath = (Join-Path -Path (Get-Item -Path $PSScriptRoot).Parent -ChildPath "FunctionApp\Countries\run.ps1")
        $functionConfig = Get-Content -Path (Join-Path -Path (Get-Item -Path $PSScriptRoot).Parent -ChildPath "FunctionApp\Countries\function.json") | ConvertFrom-Json
        $httpOutBindingName = $functionConfig.bindings.Where({$_.direction -eq 'out' -and $_.type -eq 'http'}).name
        $nameSearchOutput = 'search-results'
        $randomOutput = 'random-country'

        # create some shared mocks
        Mock -CommandName 'Search-CountryName' -MockWith { $nameSearchOutput }
        Mock -CommandName 'Get-RandomCountry' -MockWith { $randomOutput }
        Mock -CommandName 'New-FunctionOutput' -MockWith { $CountryResponse }
        Mock -CommandName 'Push-OutputBinding' -MockWith { }
    }
}
```

Here's what we should validate (implementation can be found [here](https://github.com/tmeadon/ps-func-testing/blob/49dd4043b50c89963d4a41ae805efb6038250c07/tests/Countries.tests.ps1#L69-L107)):

- Function configuration
  - It has a properly configured HTTP input binding (with expected methods, authorisation level etc.)
  - It has an HTTP output binding
- Function code (`run.ps1`)
  - If the `NameSearch` query string is provided then `Search-CountryName` and `New-FunctionOutput` should be called correctly
  - If the `NameSearch` query string is provided then `Push-OutputBinding` should be called with the correct `Name` parameter (should match the name of the HTTP output binding in `function.json`) and `Value` parameter (an `HttpResponseContext` object with the expected status code and body)
  - If no query string parameters are provided then `Get-RandomCountry` and `New-FunctionOutput` should be called correctly
  - If no query string parameters are provided then `Push-OutputBinding` should be called correcly
