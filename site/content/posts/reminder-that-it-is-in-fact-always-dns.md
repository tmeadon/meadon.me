---
author: Tom Meadon
title: Further Evidence That It Is, In Fact, Always DNS
date: 2024-07-03T08:12:17Z
draft: false
---

I’ve been back in [the engine room](https://architectelevator.com/) a bit more over the last couple of weeks. And it’s been great - or at least it had been, until I starting helping one of my team with a problem they were facing with a solution we were building for a customer.  

This problem came out of nowhere - one day everything was working normally, and the next day it wasn’t. Without us having released any changes. Affecting all environments. Whaaat?

It was the kind of problem that you would have thought would be resolved by a quick fix, until it wasn’t. The kind of problem that plagues you at night when you’re trying to sleep, and drives your imposter syndrome through the roof. The kind of problem that’s so deep in the weeds that it’s nigh on impossible to explain to your partner, or anyone else non-technical that might be wondering why you’ve spent the entire evening staring into thin air and barely talking. 

Nasty. But thrilling. 

This particular issue came at the intersection of two abstraction layers that would typically have several layers of buffer between them. It was [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview) - Microsoft’s serverless Functions-as-a-Service offering - meeting the virtual network layer. 

The Premium tier of Azure Functions has a feature that allows you to connect your app to an existing virtual network, enabling it to participate as a host on your private network. This is useful for scenarios where you need to connect to private services, or route your outbound traffic in a certain direction to meet security and compliance requirements. Enabling this feature is a breeze: create a dedicated subnet in your virtual network, then set some config in your Function App. Then it should all just work - and in my previous experience this has been true. 

This setup was working as it should, until one day, connectivity simply dropped overnight and we found ourselves unable to manage these Function Apps. Errors all over the place. We tried everything we could think of from the troubleshooting book: scouring logs, poring over documentation, redeploying the infrastructure and software, and removing all config and adding it back bit by bit to see where it breaks. We even got into the territory of running network-level packet captures to look for a clue. 

Then we found one. The Function App was making outbound DNS requests which were being routed to the customer’s internal DNS server per their network configuration. We pulled on this thread and eventually discovered that the Function App was trying to resolve its own hostname in DNS, which, for reasons I won’t go into in this post, had started to fail. It turns out that there had been some changes to DNS in the customer’s network broke this *undocumented requirement*. We reverted the DNS change and hey presto - everything started working again. 

So there you go - further evidence that it is in fact, always DNS. We could have saved a lot of time by looking here instead: https://isitdns.com/ 🤷🏼‍♂️


