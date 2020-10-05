[CmdletBinding()]
Param ()

$rgName = 'meadonme'
$rgLocation = 'uksouth'
$storageAccountName = 'meadonme'

# ensure the resource group exists
if (-not (Get-AzResourceGroup -ResourceGroupName $rgName -ErrorAction SilentlyContinue))
{
    New-AzResourceGroup -ResourceGroupName $rgName -Location $rgLocation
}

# deploy the arm template
New-AzResourceGroupDeployment -ResourceGroupName $rgName -TemplateFile $PSScriptRoot\blog.deploy.json -StorageAccountName $storageAccountName -Verbose

# enable static website
$storageAccount = Get-AzStorageAccount -ResourceGroupName $rgName -AccountName $storageAccountName
Enable-AzStorageStaticWebsite -Context $storageAccount.Context -IndexDocument 'index.html' -ErrorDocument404Path '404.html' -Verbose

# deploy the files
Get-ChildItem -Path '.\deploy\blog\site' -File -Recurse | Set-AzStorageBlobContent -Container '$web' -Context $storageAccount.Context -Force # -Properties @{ ContentType = "text/html; charset=utf-8"; }