---
author:
title: "Hosting this static site: Hugo, Azure Storage, CloudFlare & GitHub Actions"
date: 2020-09-24T08:12:17Z
draft: true
categories:
- How To
tags:
- hugo
- containers
- azure
- ci/cd
- github-actions
- web
---
Welcome to my blog!

For my first post I thought I would write about the end-to-end process I followed to get this site online.  I'll be covering local development, initial deployment and setup and finally the plan for pushing changes moving forward.

The first decision I made when it came to designing the site was that it should be static - to my mind there's no need to run (and pay for!) a stateful web server (along with the security, reliability, scalability implications) when all I'm looking to do is serve up some simple blog pages.  I soon discovered that there's a ton of great static site generators available so, in the most scientific way possible, I picked the first one of the list described as "fast": [Hugo](https://gohugo.io/).  My plan was to spend a short amount of time with Hugo and then select a different generator if it seemed too challenging - as you'll see, it didn't come to that.

The next decision was around how I was going to host my static site following its generation.  I chose to host the site in [static websites in Azure Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website) because I knew it would be cheap and would also offer a simple file deployment mechanism.  There are a few limitations with doing this however, the primary one being Azure Storage does not yet natively support HTTPS with custom domains.  Fortunately [Cloudflare](https://www.cloudflare.com/en-gb/ssl/) offer free SSL/TLS protection for any website providing you're happy to delegate management of your DNS zone to them - which I am!

#### Local development

After deciding how I'm going to build and host the site the next logical step was to get something up and running locally.  According to [Hugo's Quick Start guide](https://gohugo.io/getting-started/quick-start/), the first I needed to do was install Hugo.  Personally I try to keep my machine as tidy as possible so I decided to develop this project using VS Code's dev containers extension (see [here](https://code.visualstudio.com/docs/remote/containers) for more information about setting this up).  To get started, I created a new project, initialised a git repository and fired up VS Code:

```PowerShell
mkdir blog
cd blog
git init
code .
```

Once VS Code fired up I used the Command Palette (`F1`), selected `Remote-Containers: Open Folder in Container` and chose the current directory.  The next prompt asked me to select a container image and on the off chance that one already existed for Hugo, I selected `Show All Definitions...` and searched for "hugo".  I was very happily surprised to find an existing image for Hugo!

![Hugo container](/images/hugo-dev-container_0.gif)

After the container image downloaded and spun up, VS Code presented me with my new project directory, a `zsh` shell to play with and a couple of files in a new directory called `.devcontainer`.  As a quick test to see that what I was presented with is what I was expecting I ran `hugo version` which returned `Hugo Static Site Generator v0.75.1...`.  Great, time to get cracking.

First, I created a new Hugo 'site':

```zsh
hugo new site blog
```

Next, I chose a theme from [Hugo's library](https://themes.gohugo.io/) (I selected 'Anatole') and added it to the site by adding a `git submodule` for the theme:

```zsh
git submodule add https://github.com/lxndrblz/anatole.git blog/themes/anatole
```

The theme's subdirectory includes an example site which seemed like a good place to start, so I replaced the contents of my site's `config.toml` file with the contents of the file from the example.  Using the [theme's docs](https://themes.gohugo.io/anatole/) I made some changes to the config file (e.g. site title, profile picture etc.) and then ran the following command to build the site and host a local copy using Hugo's web server at `http://localhost:1313/`:

```zsh
cd ./blog
hugo server -s blog
```

#### Initial deployment and setup

...

#### CI/CD

...