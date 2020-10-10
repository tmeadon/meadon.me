[CmdletBinding()]
Param ()

$rgName = 'blog'
$rgLocation = 'uksouth'
$storageAccountName = 'blogmeadonme'

# ensure the resource group exists
if (-not (Get-AzResourceGroup -ResourceGroupName $rgName -ErrorAction SilentlyContinue))
{
    New-AzResourceGroup -ResourceGroupName $rgName -Location $rgLocation
}

# deploy the arm template only if the storage account doesn't exist
if (-not (Get-AzStorageAccount -StorageAccountName $storageAccountName -ResourceGroupName $rgName))
{
    New-AzResourceGroupDeployment -ResourceGroupName $rgName -TemplateFile $PSScriptRoot\blog.deploy.json -StorageAccountName $storageAccountName -Verbose
}

# enable static website
$storageAccount = Get-AzStorageAccount -ResourceGroupName $rgName -AccountName $storageAccountName
Enable-AzStorageStaticWebsite -Context $storageAccount.Context -IndexDocument 'index.html' -ErrorDocument404Path '404.html' -Verbose

# enable azure storage logging
Set-AzStorageServiceLoggingProperty -ServiceType Blob -LoggingOperations Read, Write, Delete -RetentionDays 365 -Version 2.0 -Context $storageAccount.Context