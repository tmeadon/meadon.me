---
author: Tom Meadon
title: "The Subtle Art of Cloud Governance"
date: 2023-07-22T08:12:17Z
draft: false
---

Finding a balance between agility and control when managing a cloud environment is like walking a tightrope. Lean too far on one side and your teams find themselves hamstrung, unable to innovate; the other, and before you know it, your environment resembles the Wild West.  

One of the core value propositions of the cloud is self-service - it opens the door to huge innovation potential.  Organisations that want to open that door should do so whilst protecting their positions on security, compliance, and cost management.  Given that each organisation has different needs, cloud governance should be viewed as a spectrum between two extremes: libertarianism and totalitarianism.  Let’s have a look at some of the levers you can pull to move your environment left or right on the scale.

### Policy:  what is allowed, and where

Applying policy allows you to control what people can build and how, in granular detail, they can build it.  Common controls that you can apply include enforcing data sovereignty, mandating certain resource tags, and imposing a naming convention.

But it doesn’t have to stop there: any property of any service can potentially be controlled by policy.  For example you could require specific application runtimes, block resources without precise private networking setups, or stipulate allowed source registries for containerised workloads.  

Remember though: every policy you apply is potentially creating another hoop that a developer needs to jump through in order to use your platform.  So if you’re going to implement controls, here are some tips to help you help them:

- Use clear names and descriptions for policies to make it easy for people to understand why something’s being blocked
- It’s tempting to apply less control to lower development environments - don’t do it, you’re setting your teams up to inevitably run into blocks when they progress to higher environments (create a totally separate sandbox environment for experimentation if needed)
- Automatically remediate non-compliant resource after the fact if possible to reduce the impact of policy assignments - do what you can to limit blockers
- Don’t apply policy beyond the needs of your organisation just because you can - only restrict what you need to restrict
- If you’re going to venture into applying more granular controls, then consider creating additional tooling (templates / scripts) to help users of your cloud environment be as productive as possible, and be prepared to spend time with your users to help them establish a compliant baseline

### Role-Based Access Control: who is allowed to do what

RBAC is used to control who has access to which resources in which environments.  Typically you’ll see the application of roles align with job function - a network admin, for example, might have access to modify network policy but not change application config, whilst a DBA will only have access to database servers.  

The principle of least privilege is key to any RBAC model - you should not provide access to people that don’t absolutely need it in order to perform their job.  Sometimes though this is taken too far, and it becomes more like the principle of no privilege.  An example of this is providing developers with access to production environments - often this is simply not allowed, with developers having to rely on a different team to access logs and metrics.  But what happens when a bug is found in production, or a developer needs to assess the impact of a new feature, and they need to see production observability data?  They need to be able to see that information in order to effectively carry out their role, rather that relying on some other team to relay the information to them.  

In order to walk the line of least privilege sometimes the cloud platform’s built-in role definitions don’t cut the mustard, and we need to turn to custom roles.  These give you the flexibility you need to assign users with just enough permissions to do their role without compromising your security posture, but they can get complex.  I’d always recommend managing these definitions using infrastructure as code tooling to help with ongoing management.  

It’s important to remember that RBAC models often reflect the structure of your organisation, and organisations change over time.  For that reason RBAC models should be regularly reviewed and refined to ensure they’re continuing to deliver the right balance: users should have the rights to perform their jobs effectively - no more, no less.

### Communication: collaboration is key!

Clear communication channels are vital for keeping cloud governance in check while maximising agility. Implementing open channels for collaboration, like chat rooms and wikis, ensures developers and platform engineers alike can freely exchange ideas, discuss challenges, and find quick resolutions to common blockers. . Encourage knowledge-sharing and promote a culture of collaboration across teams; this way, your organisation can benefit from the collective intelligence of your workforce and continually fine-tune its governance strategy.  Remind teams to explain the why behind their actions, queries, or complaints - if teams become blocked then those that are responsible for managing governance can work collaboratively to achieve the goal without compromising compliance.  Likewise, if a development team understand exactly why a particular rule is in place, and the impact of the rule, then they will be able to work around it from the start.  

To conclude: striking that perfect balance between agility and control when delivering cloud governance needs a nuanced approach.  It is essential to enforce only required policies and employ the principle of least privilege whilst granting access to resources. Custom roles and policy definitions provide more precision and may aid you in finding the right balance without compromising security or inhibiting productivity.  As always though, creating an environment of open communication and collaboration promotes knowledge-sharing, and streamlines problem-solving.  By carefully managing these three aspects, organisations can ensure they are walking the tightrope of cloud governance effectively and securely.
