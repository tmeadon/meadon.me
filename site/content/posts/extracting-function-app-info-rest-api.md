---
title: "Extracting information from Azure Functions using the REST API"
date: 2020-10-26T08:00:00Z
draft: false
tags:
- tech
images:
- /images/pwsh_functions.png
---

Recently I needed to pull some information out of several Azure Function Apps as a final task in their deployment pipeline and I found that my go-to Azure PowerShell commands did not give me what I needed.  This post describes how you can use the Azure REST API when your favourite tools don't quite cut the mustard.

<!--more-->

## Background

First - a brief explanation of what I was trying to do: my team and I were figuring out how we should distribute our PowerShell Azure Functions between different App Service Plans in order to optimise performance.  The Functions were being deployed to various Function Apps using an Azure DevOps Release pipeline and since we were intending on moving the individual Functions between Function Apps, we decided to add a task in the pipeline to pull out the Function keys and URL's for each Function to save us from having to visit the Portal everytime we jigged the distribution around.  The intention was to then push the complete URL (i.e. URL + the `code` query string parameter) for each Function into an Azure Key Vault account.

To tackle this my first port of call was the new(ish) `Get-AzFunctionApp` cmdlet, however I found that it only returns host level information such as the runtime, identity, application settings etc. - nothing about the individual Functions.  It was a similar story for the `Get-AzWebApp` cmdlet.  I found a few resources online that described how to use the REST API to retrieve Function keys so I decided to take a look at the [Azure Web Apps REST API documentation](https://docs.microsoft.com/en-us/rest/api/appservice/webapps) and it didn't take long to find the ['List Functions'](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/listfunctions) and ['List Functions Keys'](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/listfunctionkeys) operations.

## How to make REST API requests?

Before we can do anything else we need to figure out how we're going to make the calls to the REST API and I should start by saying that there a million and one ways to do it - every programming language has a plethora of methods to invoke HTTP requests.  I'll be focusing on some of the options available in PowerShell however you should be able to apply the information to your language of choice.

The hardest part of making REST API requests to Azure Resource Manager is authentication; we're used to authenticating once when working with Azure's various command line tools and having the tools handle the authenication requirements for each request under the bonnet.  Since we'll be dealing with the raw HTTP requests (that the command line tools ultimately make for us), we'll need to supply the required [HTTP authentication headers](https://docs.microsoft.com/en-us/rest/api/azure/) with each request.

Or will we?  Version `4.7.0` of the Azure PowerShell module introduced a shiny new cmdlet called `Invoke-AzRestMethod` which allows users to make arbitrary REST API requests to any Azure management endpoint without having to worry about authentication - result!  Before this cmdlet existed we would have had to jump through a few hoops before being able to make REST API requests:

- First we would have needed an Azure App Registration (see [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-authenticate-service-principal-powershell) for information about how to create one)

- Using the App Registration's client ID and client secret properties (available in the Azure Portal), we would have then needed to request an access token from Microsoft by running something like:

    ```PowerShell
    # request REST API access token
    $tenantId = <AzureTenantId>
    $appRegId = <AppRegistrationClientId>
    $appRegSecret = <AppRegistrationClientSecret>
    $resource = "https://management.core.windows.net/"
    $requestAccessTokenUri = "https://login.microsoftonline.com/{0}/oauth2/token" -f $TenantId
    $body = "grant_type=client_credentials&client_id={0}&client_secret={1}&resource={2}" -f $AppRegId, $AppRegToken, $resource
    $token = Invoke-RestMethod -Method Post -Uri $requestAccessTokenUri -Body $body -ContentType 'application/x-www-form-urlencoded'
    ```

- With that token, we could have then ran something like this to construct the header and then make the request:

    ```PowerShell
    # prepare HTTP headers
    $headers = @{
        Authorization = ("{0} " -f $token.token_type) + " " + ("{0}" -f $token.access_token)
    }

    $resourceId = <AzureResourceId>
    $apiVersion = <ApiVersionForTheRequest>

    # make the request
    $uri = "https://management.azure.com{0}?api-version={1}" -f $resourceId, $apiVersion
    Invoke-RestMethod -Uri $uri -Headers $headers -Method <SomeMethod>
    ```

Using `Invoke-AzRestMethod` we don't have to worry about any of that - as long as we've logged in to Azure PowerShell (using `Connect-AzAccount`) we can simply run:

```PowerShell
Invoke-AzRestMethod -Path ('{0}?api-version={1}' -f $resourceId, $apiVersion) -Method <SomeMethod>
```

For the rest of this post I'll be using the `Invoke-AzRestMethod` option - for obvious reasons :smiley:

## Processing the response

So what does `Invoke-AzRestMethod` give us?  Well of course it depends on the operation you're performing, but at very least it will return a `Microsoft.Azure.Commands.Profile.Models.PSHttpResponse` object containing the response headers, the status code, the HTTP method, the HTTP version and the response content.  The `Content` property contains the information we're looking to retrieve in JSON form, so to convert it to a form that's easier to work with in PowerShell (i.e. a `PSCustomObject`), we can run:

```PowerShell
$response = Invoke-AzRestMethod -Path ('{0}?api-version={1}' -f $resourceId, $apiVersion) -Method <SomeMethod>

$response.Content | ConvertFrom-Json
```

From there we can explore the response as we would any PowerShell object.

## Listing the Functions in a Function App

Now we understand the basics of interacting with the Azure REST API, let's see how we can go about listing out the Functions in a given Function App.  The very first thing we need is the resource ID for the Function App, which we can get by running:

```PowerShell
$fa = Get-AzFunctionApp -Name <NameOfFunctionApp> -ResourceGroupName <NameOfResourceGroup>
```

According to the [docs](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/listfunctions) we can list the functions by appending `/functions` to the resource ID in the request URI as well as the API version (I'll be using the latest version at the time of writing: `2020-06-01`).  Running that against my example Function App gives me the following:

```PowerShell
# make the http request and convert the Content to a PSCustomObject
$functions = (Invoke-AzRestMethod -Path ($fa.Id + "\functions?api-version=2020-06-01") -Method GET).content | ConvertFrom-Json
```

The `$functions` variable now has an array property called `value` which contains objects for each of the Function App's Functions:

```text
id         : /subscriptions/abc123/resourceGroups/fa-example/providers/Microsoft.Web/sites/tomsfunctionapp/functions/HttpTrigger1
name       : tomsfunctionapp/HttpTrigger1
type       : Microsoft.Web/sites/functions
location   : UK South
properties : @{name=HttpTrigger1; function_app_id=; script_root_path_href=https://tomsfunctionapp.azurewebsites.net/admin/vfs/site/wwwroot/HttpTrigger1/;
             script_href=https://tomsfunctionapp.azurewebsites.net/admin/vfs/site/wwwroot/HttpTrigger1/run.ps1; config_href=https://tomsfunctionapp.azurewebsites.net/admin/vfs/site/wwwroot/HttpTrigger1/function.json;
             test_data_href=https://tomsfunctionapp.azurewebsites.net/admin/vfs/data/Functions/sampledata/HttpTrigger1.dat; secrets_file_href=; href=https://tomsfunctionapp.azurewebsites.net/admin/functions/HttpTrigger1; config=;
             files=; test_data=; invoke_url_template=https://tomsfunctionapp.azurewebsites.net/api/httptrigger1; language=powershell; isDisabled=False}

id         : /subscriptions/abc123/resourceGroups/fa-example/providers/Microsoft.Web/sites/tomsfunctionapp/functions/HttpTrigger2
name       : tomsfunctionapp/HttpTrigger2
type       : Microsoft.Web/sites/functions
location   : UK South
properties : @{name=HttpTrigger2; function_app_id=; script_root_path_href=https://tomsfunctionapp.azurewebsites.net/admin/vfs/site/wwwroot/HttpTrigger2/;
             script_href=https://tomsfunctionapp.azurewebsites.net/admin/vfs/site/wwwroot/HttpTrigger2/run.ps1; config_href=https://tomsfunctionapp.azurewebsites.net/admin/vfs/site/wwwroot/HttpTrigger2/function.json;
             test_data_href=https://tomsfunctionapp.azurewebsites.net/admin/vfs/data/Functions/sampledata/HttpTrigger2.dat; secrets_file_href=; href=https://tomsfunctionapp.azurewebsites.net/admin/functions/HttpTrigger2; config=;
             files=; test_data=; invoke_url_template=https://tomsfunctionapp.azurewebsites.net/api/httptrigger2; language=powershell; isDisabled=False}
```

## Retrieving the URL for a Function

Expanding out the `properties` property for the first item in the array shows the existence of a property called `invoke_url_template` whose value is the URL for the Function - exactly what I was looking for!  So, to list the URLs for all of the Functions we can run:

```PowerShell
$functions.value.properties.invoke_url_template
```

Which - for my example Function App - returns:

```text
https://tomsfunctionapp.azurewebsites.net/api/httptrigger1
https://tomsfunctionapp.azurewebsites.net/api/httptrigger2
```

## Retrieving the Function keys for a Function

To get the keys for the individual Functions, we can use the ['List Functions Keys'](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/listfunctionkeys) operation for each Function by running:

```PowerShell
# make the rest request
$keys = (Invoke-AzRestMethod -Path ($fa.Id + "\functions\<FunctionName>\listkeys?api-version=2020-06-01") -Method POST).Content | ConvertFrom-Json

# if you've not added any additional keys, $keys will have a single property called default containing the function's key
$keys.default
```

So, in order to get the keys for all of the Functions in a Function App, we can iterate through the `$functions` variable we created in the previous section and output a PSCustomObject for each Function:

```PowerShell
foreach ($functionName in $functions.value.properties.name)
{
    $keys = (Invoke-AzRestMethod -Path ($fa.Id + "\functions\$functionName\listkeys?api-version=2020-06-01") -Method POST).content | ConvertFrom-Json
    [PSCustomObject]@{FunctionName = $functionName; DefaultKey = $keys.default}
}
```

## Stitching it together

Using what we discovered in the previous two sections we can put together a PowerShell function that could be called from a task in the deployment pipeline.  The example function below will pull out the complete URLs for all of the Functions in a given Function App and will create (or update) a secret in a given Key Vault account for each Function containing its URL.  The name of the secrets will match the Functions' names, so make sure there aren't any existing secrets in your Key Vault account with the same names before running this!  

```PowerShell {linenos=table}
function Save-FunctionAppDetails
{
    [CmdletBinding()]
    param
    (
        # Function app name
        [Parameter(Mandatory)]
        [string]
        $FunctionAppName,

        # Name of the function app's resource group
        [Parameter(Mandatory)]
        [string]
        $FunctionAppResourceGroup,

        # Key vault name
        [Parameter(Mandatory)]
        [string]
        $KeyVaultName
    )

    begin {}

    process
    {
        # check the function app and the key vault exist
        $functionApp = Get-AzFunctionApp -Name $FunctionAppName -ResourceGroupName $FunctionAppResourceGroup -ErrorAction SilentlyContinue
        $keyVault = Get-AzKeyVault -VaultName $KeyVaultName -ErrorAction SilentlyContinue

        if (-not $functionApp) { throw ('Unable to find a function app called {0} in resource group {1}' -f $FunctionAppName, $FunctionAppResourceGroup) }
        if (-not $keyVault) { throw ('Unable to find a key vault account called {0}' -f $KeyVaultName) }

        # invoke the rest api methods and store the complete url for each function in a hashtable
        $functionUrls = @{}
        $functions = (Invoke-AzRestMethod -Path ($functionApp.Id + "\functions?api-version=2020-06-01") -Method GET).content | ConvertFrom-Json

        foreach ($func in $functions.value)
        {
            # only get the keys for functions with URLs (i.e. ignore non-http triggered functions)
            if ($func.properties.invoke_url_template)
            {
                $keys = (Invoke-AzRestMethod -Path ($functionApp.Id + "\functions\$($func.properties.name)\listkeys?api-version=2020-06-01") -Method POST).Content | ConvertFrom-Json
                $functionUrls.Add($func.properties.name, ('{0}?code={1}' -f $func.properties.invoke_url_template, $keys.default))
            }
        }

        # iterate through the hashtable's keys and create a key vault secret for each one
        foreach ($key in $functionUrls.Keys)
        {
            $kvSecretParams = @{
                VaultName = $keyVault.VaultName
                Name = $key
                SecretValue = (ConvertTo-SecureString -String $functionUrls[$key] -AsPlainText -Force)
            }
            Set-AzKeyVaultSecret @kvSecretParams | Select-Object -ExpandProperty Id
        }
    }

    end {}
}
```

Harnessing the power of Azure's REST API enables you to take complete control over how you interact with Azure Resource Manager and removes your dependency on the other Azure management tools.  The `Invoke-AzRestMethod` cmdlet is an excellent trick to have up your sleeve for when your needs are too great for the regular toolsets - happy RESTing!
