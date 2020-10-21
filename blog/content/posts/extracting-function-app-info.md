---
title: "Extracting information from Azure Functions using the REST API"
date: 2020-10-16T12:49:29Z
draft: true
categories:
- How To
tags:
- azure
- powershell
- azure-functions
- automation
---
Recently I needed to pull some information out of several Azure Function Apps as a final task in their deployment pipeline and I found that my go-to Azure PowerShell commands did not give me what I needed.  This post describes how you can use the Azure REST API when your favourite tools don't quite cut the mustard.

First - a brief explanation of what I was trying to do: my team and I were figuring out how we should distribute our PowerShell Azure Functions between different App Service Plans in order to optimise performance.  The Functions were being deployed to various Function Apps using an Azure DevOps Release pipeline and since we were intending on moving the individual Functions between Function Apps, we decided to add a task in the pipeline to pull out the Function keys and URL's for each Function to save us from having to visit the Portal everytime we jigged the distribution around.  The intention was to then push the keys into an Azure Key Vault instance and store the URLs in some JSON in Azure Blob Storage.

To tackle this my first port of call was the new(ish) `Get-AzFunctionApp` cmdlet, however I found that it only returns host level information such as the runtime, identity, application settings etc. - nothing about the individual Functions.  It was a similar story for the `Get-AzWebApp` cmdlet.  I found a few resources online that described how to use the REST API to retrieve Function keys so I decided to take a look at the [Azure Web Apps REST API documentation](https://docs.microsoft.com/en-us/rest/api/appservice/webapps) and it didn't take long to find the ['List Functions'](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/listfunctions) and ['List Functions Keys'](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/listfunctionkeys) operations.



#### Get the functions in a function app

```PowerShell
# first get the function app
$fa = Get-AzResource -Name $faName -ResourceGroupName $rgName

# invoke rest api method and convert the response from json
$response = (Invoke-AzRestMethod -Path ($fa.id + "/functions?api-version=2019-08-01") -Method GET).Content | ConvertFrom-Json -Depth 100

# output a list of functions
$repsonse.value
```

#### Get the function keys for a given function

```PowerShell
$response = (Invoke-AzRestMethod -Path ($fa.id + "/functions/$($functionName)/listkeys?api-version=2019-08-01") -Method POST).Content | ConvertFrom-Json
```
