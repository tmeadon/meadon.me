---
author: Tom Meadon
title: "Software Delivery Idealism"
pubDate: 2023-01-29T08:12:17Z
draft: false
tags:
  - thought
---

There is a lot of idealistic rhetoric in the software industry.  That’s not exactly new, and for the most part we’re able to look past the often quite absolute language (the “musts” and the “bests”), and remember the importance of context.  But that statement generally only holds when we talk about software engineering principles (tools, technologies, and design patterns). I feel we have a way to go when we talk about software delivery principles (people and processes).

This post (rant) was inspired by a tweet I saw recently which called out anyone who uses pull requests as part of their teams' development workflow, along the lines of:

> _Wow people are still using pull requests? They really don't know what they're doing!_

I've paraphrased. But not much.

For me, statements like these are the equivalent of those posts you see on Instagram of people's 'perfect' lives (like images of moleskin diaries, tortoiseshell specs, a fancy pen, and a nice latte depicting the poster's 'typical' working environment).  Whether or not it's intentional, it'll usually boost the author's ego whilst simultaneously boosting the reader's/viewer's feelings of inadequacy.

Idealistic statements about software delivery, like this one, fail to account for organisational context. Being able to remove pull requests from the development workflow without having a catastrophic effect is predicated on the presence of robust continuous delivery practices. Implementing these practices for larger projects will often require a considerable investment - it certainly can't be done overnight. Some teams don’t have the capability, or frankly the time, to fully embrace continuous delivery to the point where pure trunk-based development would be successful.

Another example of idealism is the assertion that if you're not deploying to production multiple times a day you're doing it wrong. There are many contexts in which doing this isn't relevant, isn't possible (due to commercial or regulatory factors), or just simply wouldn't add any value. There are, however, plenty of organisations not doing this simply due to 'traditional' siloed structures, based on some kind of primal fear of allowing a development team access to the production environment.

It's easy to be guilty of forgetting the difference between correlation and causation. Forsgren, Humble, and Kim truly broke new ground in their book Accelerate by unearthing a set of practices and behaviours found in high-performance delivery teams, and the cultures that surround them. We shouldn't take specific practices in isolation and view them as keys to unlock the secret of high performance. I'd suggest that successful organisations don't find their success by having their teams do 'thing X' or not do 'thing Y'. Rather, the organisation's culture _enables_ teams to do, or not do, things X and Y, which allows them to boost their performance even higher. If your organisation's culture doesn't enable practices and behaviours of high-performance teams, then you have a bigger problem to fix before getting into the nuts and bolts of the production of software.

Ideals in software delivery are hugely important. They can give the right organisations a powerful boost. For others, they can be used to shine a light on areas that need to be improved to find greater performance. We mustn't forget though that all that truly matters is the delivery of value, and the wellbeing of the team delivering that value. We can view ideals as avenues to explore if we need to move the performance needle in a particular direction. They don't have to be gospel.
