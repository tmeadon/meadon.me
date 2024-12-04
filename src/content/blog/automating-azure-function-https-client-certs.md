---
title: "Automating Azure Functions Private HTTPS Client Certificates"
pubDate: 2022-01-03T18:59:19Z
draft: false
tags:
  - tech
summary: |
  This post describes an approach for automating the management of private client HTTPS certificates in your Azure Function Apps.
images:
  - /images/azure-functions-pwsh-certs.png
---

One of the most powerful features of Azure Functions are their input and output bindings which enable simple integration with other services. Whilst the [collection of bindings](https://docs.microsoft.com/en-us/azure/azure-functions/functions-triggers-bindings?tabs=csharp#supported-bindings) currently on offer covers a good number of common integration points, it is likely that we will need to communicate with a service that doesn't have a binding at some point in the future. When this happens we will need to implement this communication ourselves which, more often than not, will involve making HTTP calls to the service using whatever method is appropriate in our language of choice. As it's 2021 it really ought to be fair to assume that we'll be communicating with the service using HTTPS, so what happens when that service is offering up a non-public (e.g. self signed or produced by a private certificate authority) certificate for HTTPS?

Simple - since the Functions runtime doesn't implicitly know to trust the service's private certificate it won't be able to authenticate the server and your requests will fail. Fortunately Azure Functions provide us with the ability to upload the public key of our service's HTTPS certificate which enables the trust and therefore fixes this problem. This is dead easy to do via the Function App's 'TLS/SSL settings' section in the Azure Portal, but clicky clicky solutions like this firstly aren't much fun and secondly don't help when we want to automate this task in a pipeline or similar.

The question I'll be answering in this post is: how we can automate this process using PowerShell?

### Getting hold of the public key certificates

The first challenge is to get the public key certificates that we wish to upload into our Function App and to do this we have a couple of options:

1. Download the certificates from the service(s) manually (using a web browser for instance), store them somewhere safe (e.g. Azure Key Vault) and then download them from there at runtime
2. Download the certificates from the service(s) directly at runtime by establishing an HTTPS connection to them in code

Whilst option 2 is probably a bit trickier to achieve, it has the following benefits: we don't have to maintain our copy of the certificates (and keep an eye on whether their still relevant or not), and scaling to multiple services requires minimal effort.

I couldn't find a PowerShell native way to connect to a given web server and read it's HTTPS certificate, so I turned to the `System.Net.Security` .NET namespace - specifically the `TcpClient` and `SslStream` classes (the ability to do this is one of the many great things about PowerShell :smiley:):

```powershell
$hostname = "enter_hostname"

# create a new TcpClient instance and connect it to $hostname over port 443
$tcpClient = [System.Net.Sockets.TcpClient]::new($hostname, '443')

# create an SslStream instance from the TcpClient and authenticate the server
$stream = [System.Net.Security.SslStream]::new($tcpClient.GetStream())
$stream.AuthenticateAsClient($Hostname)

# read the certificate from the stream's RemoteCertificate property
$cert = $stream.RemoteCertificate
```

This code gives us the certificate at the end of the chain which isn't quite enough for the Functions runtime to be able to trust our service, we'll also need to get the public key of every other certificate in the chain (i.e. any intermediate and root CAs). The `System.Security.Cryptography` .NET namespace can help here:

```powershell
$chain = [System.Security.Cryptography.X509Certificates.X509Chain]::new()
$chain.Build($cert)
```

The `$chain` variable will now contain a collection of certificates (or more precisely `X509ChainElement` objects) corresponding to each certificate in the chain.

### Uploading the certificates

Now that we've got our hands on our service's full HTTPS certificate chain we can proceed with uploading the certificates to our Function App. Unfortunately (at time of writing) this task isn't supported by Azure PowerShell or the Azure CLI so we'll need to turn to Azure's REST API to accomplish this (see [my article](https://meadon.net/posts/extracting-function-app-info-rest-api/) for more information about using the REST API), specifically the ['Create Or Update Public Certificate'](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/createorupdatepubliccertificate) API.

According to the documentation we'll need to call the API once for each certificate we wish to upload with a request body containing a byte array representation of the certificate as well as a target local certificate store ([options can be found here](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/createorupdatepubliccertificate#publiccertificatelocation) - we'll be using `LocalMachineMy`). The outline for this stage of the process is as follows:

- Walk the certificate chain
- For each certificate:
  - Convert the certificate to a byte array (hint, we can use the `System.Security.Cryptography` .NET namespace again)
  - Invoke the REST API call to upload the certificate to the Function App

We'll need to provide a name for each certificate we want to upload so we'll define a naming prefix and then we'll create each certificate's name by appending its position in the chain (in other words `$i` in the code below).

```powershell
$functionAppResourceId = "enter_function_apps_resource_id"
$certNamePrefix = "enter_cert_name_prefix"

for ($i = 0; $i -lt $chain.ChainElements.Count; $i++)
{
    $cert = $chain.ChainElements[$i].Certificate

    $uploadPayload = @{
        properties = @{
            blob = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
            publicCertificateLocation = 'LocalMachineMy'
        }
    }

    $uploadParams = @{
        Path = ('{0}/publicCertificates/{1}_{2}?api-version=2019-08-01' -f $functionAppResourceId, $certNamePrefix, $i)
        Method = 'PUT'
        Payload = $uploadPayload | ConvertTo-Json
    }

    $null = Invoke-AzRestMethod @uploadParams
}
```

After running this we should now see our certificates in the Azure Portal (open the Function App > TLS/SSL settings > Public Key Certificates).

### Updating the Function App's app settings

At this stage our certificates are available to the Function App, but that doesn't mean they'll actually get loaded (this _definitely_ didn't catch me out... :eyes:). To instruct the Function App to load the certificates at runtime we need to add the thumbprint of each certificate to an app setting called `WEBSITE_LOAD_ROOT_CERTIFICATES` in the form of a comma-separated list.

We'll need to extract a list of thumbprints from the `$chain` variable we created earlier, configure the app settings appropriately and then update the Function App.

```powershell
$functionAppName = "enter_function_app_name"
$resourceGroupName = "enter_function_apps_resource_group"
$functionApp = Get-AzWebApp -Name $functionAppName -ResourceGroupName $ResourceGroupName -ErrorAction Stop

$chainThumbprints = ($chain.ChainElements | Select-Object -ExpandProperty Certificate).Thumbprint

$newAppSettings = @{}

foreach ($setting in $functionApp.SiteConfig.AppSettings)
{
    $newAppSettings.Add($setting.Name, $setting.Value)
}

$newAppSettings['WEBSITE_LOAD_ROOT_CERTIFICATES'] = $chainThumbprints -join ","

Set-AzWebApp -Name $functionApp.Name -ResourceGroupName $functionApp.ResourceGroup -AppSettings $newAppSettings
```

By this point our Function App should now be in the position where it can establish HTTPS connections to services secured with a private certificate :tada:

### Piecing this together

To make this code more usable I have written a set of PowerShell functions which can be invoked by a script/pipeline task - see below. I have added some extra functionality to the functions below to make the whole thing more efficient, for example by only uploading certificates that haven't already been uploaded (this helps when this is run multiple times in a pipeline). Also, by splitting the code up into small functions like this I have made the next task on my to do list a breeze: writing Pester tests. Until then, feel free to get in touch if you have any questions - cheers!

{{< gist tmeadon ff0181fe91dc93e9f209219fd1599fd6 >}}
