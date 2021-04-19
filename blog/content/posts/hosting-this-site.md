---
author:
title: "Hosting this static site: Hugo, Azure Storage, Cloudflare & GitHub Actions"
date: 2020-09-24T08:12:17Z
draft: false
categories:
- How To
tags:
- hugo
- containers
- azure
- ci-cd
- github-actions
- web
---
Welcome to my blog!

For my first post I thought I would write about the end-to-end process I followed to get this site online.  I'll be covering local development, initial deployment and setup and finally how I set up a rudimentary CI/CD process using GitHub Actions.

<!--more-->

{{< table_of_contents >}}

## What's the plan?

The first decision I made by way of design for the site was that it should be static - to my mind there's no need for me to run (and pay for!) a stateful web server (along with the security and reliability implications) when all I'm looking to do is serve up some simple blog pages.  I soon discovered that there's a ton of great static site generators available so, in the most scientific way possible, I picked one almost totally at random: [Hugo](https://gohugo.io/).  My plan was to spend a short amount of time with Hugo and then select a different generator if it seemed too challenging - as you'll see, it didn't come to that.

Something else that I decided early on was that I wanted to host the site using [static websites in Azure Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website) because I knew it would be cheap, easy to deploy to and would offer welcome familiarity for me in this strange new world of blogging.  This service does have one fairly chunky hurdle to overcome however: Azure Storage does not yet natively support HTTPS with custom domains (an essential feature of any modern site).  Fortunately [Cloudflare](https://www.cloudflare.com/en-gb/ssl/) offer free SSL/TLS protection for any website providing you're happy to delegate management of your DNS zone to them - which I am!

## Local build

After deciding how I was going to build and host the site, the next logical step was to get something up and running locally.  According to [Hugo's Quick Start guide](https://gohugo.io/getting-started/quick-start/) the first thing I needed to do was install Hugo itself.  Personally I try to keep my machine as tidy as possible so I decided to develop this project using VS Code's containers extension which allows you to use a container (rather than your local disk) as fully-featured development environment (see [here](https://code.visualstudio.com/docs/remote/containers) for more information about setting this up).  To get started I created a new project, initialised a git repository and fired up VS Code:

```PowerShell
mkdir blog
cd blog
git init
code .
```

Once VS Code loaded I used the Command Palette (`F1`), selected `Remote-Containers: Open Folder in Container` and chose the current directory.  The next prompt asked me to select a container image for this project and on the off chance that one already existed for Hugo, I selected `Show All Definitions...` and searched for "hugo".  I was very happily surprised to find an existing image!

![Hugo container](/images/hugo-dev-container_0.gif)

After the container image downloaded and span up VS Code presented me with my new project directory, a `zsh` shell to play with and a couple of files in a new directory called `.devcontainer`.  As a quick test to see that all was well in my new environment I ran `hugo version` which returned `Hugo Static Site Generator v0.75.1...`.  Great, time to make a start.

First, I created a new Hugo 'site' and changed directory into it:

```zsh
hugo new site blog
cd blog
```

This created the basic structure for my static site, which the [Hugo docs](https://gohugo.io/getting-started/directory-structure/) explain nicely. Next, I chose a theme from [Hugo's library](https://themes.gohugo.io/) (I selected 'Anatole') and added it to the site by adding a `git submodule` for the theme:

```zsh
git submodule add https://github.com/lxndrblz/anatole.git themes/anatole
```

The next job was to add some basic customisations - the theme's subdirectory includes an example site which seemed like a good place to start, so I replaced the contents of my site's `config.toml` file with the contents of the file from the example.  Using the [theme's docs](https://themes.gohugo.io/anatole/) I made some changes to the config file (e.g. site title, profile picture etc.) and then ran the following command to build the site and host a local copy using Hugo's web server at `http://localhost:1313/`:

```zsh
hugo server
```

To add some content (or in other words a blog post), I ran `hugo new posts/hosting-this-site.md` which created a new markdown file under `content/posts`.  I also decided that I wanted to make some tweaks to the theme's styling which Hugo allowed me to do by chucking some CSS files (lifted from the theme's example site and fiddled around with) in `assets/css` and then enabling them by adding their relative paths to the `customCss` array property in the config file.

## Initial deployment and setup

After tinkering with the site's config and styling and adding some content, images and favicons, it was time to make the site available on the world wide web. The first job was to create the Azure storage account and enable it for static web sites - for this I turned to trusty Azure PowerShell:

```PowerShell
# create a resource group
$rg = New-AzResourceGroup -ResourceGroupName <ResourceGroupName> -Location 'uksouth'

# create a storage account
$sa = New-AzStorageAccount -ResourceGroupName $rg.ResourceGroupName -Name <StorageAccountName> -SkuName 'Standard_LRS' -Location $rg.Location -Kind 'StorageV2'

# enable static sites
Enable-AzStorageStaticWebsite -Context $sa.Context -IndexDocument 'index.html' -ErrorDocument404Path '404.html'
```

The next task was to build the site (by simply running `hugo`) and push the build's output (which is created by default under `public`) into the storage account's new `$web` container.  Since PowerShell is always my go to, I attempted to use the `Set-AzStorageBlobContent` to upload the site's root files and directories, however it didn't set the blobs' `ContentType` property correctly, resulting in my browser not rendering any of the CSS - what a mess.  Rather than spending time trying to figure out how to work around this problem, I gave [azcopy](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10) a go by running:

```PowerShell
azcopy sync ./blog/public/ "<container_sas_uri>"
```

This did the trick and now my site was accessible at the storage account's static website URL (which is readily available in the Azure Portal).  As I mentioned in the introduction, one of the downsides of using Azure Storage for hosting the site is that it doesn't support HTTPS for custom domains so at this stage I needed to hop over to Cloudflare to set up the custom domain for my site.

Cloudflare offer a free SSL/TLS offload service (including custom certificate) for any domain, all you have to do is switch the nameservers for your DNS zone over to their resolvers.  Once that's done they can route your traffic via their datacentres by changing your public DNS records to point to their ingress services.  In order to register a custom domain with Azure Storage all I needed to do was create a new CNAME record for my domain pointing to the static website endpoint for my storage account.

Unfortunately the method by which Cloudflare proxy the domain presented a trip hazard here - Azure was refusing to verify my domain because, despite the record showing as a CNAME in the Cloudflare portal, the service was actually advertising an A record pointing to a Cloudflare IP in public DNS.  To get round this I had to temporarily disable proxying for the `blog.meadon.me` domain, which caused Cloudflare to replace their A record with my 'real' CNAME record which Azure could then verify.  After the verification was successful I was able to re-enable proxying (thankfully, otherwise my plan would have been foiled!) and my site was available for HTTPS connections using my custom domain.  I have to admit this problem took me a lot longer to work out than it should have done - you know what they say, it's always DNS!

## CI/CD with GitHub Actions

Having got the first release of my site online I wanted to set up a simple CI/CD workflow to allow me push changes to the site without incurring any hassle.  This desire aligned rather nicely with another desire I had which was to have a play with GitHub Actions to see what the hype was all about - this project seemed like a entry point for me because the release workflow essentially needs two steps:

1. Build the site
2. Run `azcopy sync` with the `--delete-destination=true` parameter to mirror the contents of the blob container with the output of the build

Aside from the challenge of learning the GitHub Actions syntax, there were two other small problems to solve before I could implement these steps: how to handle authentication for `azcopy` and how to run the `hugo` steps.  For the former I decided the simplest way would be to use a SAS token, so I generated one in the Azure Portal (and added a note in my calendar a few days before it expires) and created a secret in my GitHub repository which I could then reference from the workflow.  For the latter, a quick Google lead me straight to [peaceiris'](https://github.com/peaceiris) [action-hugo](https://github.com/peaceiris/actions-hugo) Action which has everything I need for this workflow.

After researching the syntax for GitHub Actions workflows and a few trial and error commits, I ended up with a workflow file looking something like:

```yaml
name: blog

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
      with:
        submodules: true
        fetch-depth: 0

    - name: Hugo Setup
      uses: peaceiris/actions-hugo@v2
      with:
        hugo-version: '0.75.1'

    - name: Hugo build
      run: hugo -s ./blog

    - name: Copy to storage
      env:
        AZURE_STORAGE_URI: https://blogmeadonme.blob.core.windows.net/$web/
        AZURE_STORAGE_SAS: ${{ secrets.BLOG_SAS_TOKEN }}
      run: |
        azcopy10 sync ./blog/public/ "${AZURE_STORAGE_URI}${AZURE_STORAGE_SAS}" --delete-destination=true
```

With that in place, all that I need to do to release a change to the site is push a commit to my GitHub repository and the rest will be taken care of.  Hugo allows its users to place pages in a 'draft' state (see [here](https://gohugo.io/getting-started/usage/#draft-future-and-expired-content) for details) which by default won't be included in the output of the `hugo` command in the workflow above - using this I can commit in-progress posts to GitHub (in case my laptop explodes) knowing that they'll only be published when I move them out of drafts.

Feel free to go and take a look at the source code for this site - it's over on [GitHub](https://github.com/tommagumma/meadon.me).  Let's see where this takes me!
