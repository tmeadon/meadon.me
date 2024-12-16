---
author: Tom Meadon
title: "Terraform Rules of Thumb"
pubDate: 2024-12-16T09:21:00Z
draft: false
---

I've been working with infrastructure-as-code if not every day, then several times a week, since around 2018. Not that that makes me an authority, but it's certainly long enough for me to form some concrete opinions. In this post I'm sharing some of those opinions as rules of thumb that I try to follow when developing terraform, but which can also quite happily apply to other IaC languages.

#### 1. Don't sacrifice local development

This one is a real bug bear, which is why it's number 1. If you're going to take anything from this post then please let it be this!

In my experience this sacrifice take two forms. Firstly, hard dependencies on pipeline runtime environments such as using token replacement tools rather than normal terraform variables, or common modules that are copied into the deployment folder at runtime. This happens when a terraform deployment is built with the sole purpose of being deployed in a pipeline.

Using pipelines to deploy changes to real environments is the right thing to do. But that doesn't need you to build a system that stops an engineer easily testing and debugging part, or all, of a deployment locally. If you can run it locally, you can run it in a pipeline - but not necessarily vice versa. Don't make `git commit && git push && *wait forever for the pipeline to tell you about a typo*` be the only way an engineer can test out a change.

The other way that I see local development being thrown out of the window is overusing generic terraform [`maps`](https://developer.hashicorp.com/terraform/language/expressions/type-constraints#map) for module variables. When a module expects all of its inputs to be supplied in a `map(string)` (something I've seen too many times), then anyone working with those variables (module developers and consumers) are flying blind without IDE type hints or validation. This violently murders the poor old local development experience.

Sometimes dynamic maps are absolutely necessary, such as for resource tags. But when you know what parameters your module needs then define them as separate variables, or as an [object](https://developer.hashicorp.com/terraform/language/expressions/type-constraints#object) with known attributes.

```hcl
### Don't do this

variable "subnet_config" {
	type = map(string)
}

resource "subnet" "mySubnet" {
	name = var.subnet_config["name"]
	...
}

### Do this instead

variable "subnet_config" {
	type = object({
		name = string
		cidr = string
	})
}

resource "subnet" "mySubnet" {
	name = var.subnet_config.name
	...
}
```

In the first example, you're flying blind. In the second, you're flying with the terraform type system as a copilot (no, not that 🤖 kind of copilot). If you think this is so obvious that it doesn't need saying, trust me - it does.

#### 2. Consider the audience

When you're developing a terraform module, consider who the intended audience is. Sometimes the audience is platform or infrastructure engineers, and these people often value seeing and controlling some of the finer configuration details. Hiding these details can make them uncomfortable.

Software developers, on the other hand, typically value being able to get their infrastructure up and running as quickly and with as few decisions as possible. You'll get far greater engagement if your module minimises the time they spend distracted from their day job. For these folk, limit your mandatory parameters as much as possible and provide [sensible defaults](https://www.thoughtworks.com/en-gb/insights/topic/sensible-defaults) for everything else.

#### 3. Use modules to compress the complexity of common patterns

Compressing complexity is a term I've nicked from the [Ruby on Rails community](https://rubyonrails.org/), and it's a form of building balanced abstractions that don't _hide_ complexity, but still lower the cognitive load required to manage it. Applied to terraform modules, it means minimising _mandatory_ parameters whilst providing the right amount of _optional_ parameters with sensible yet opinionated defaults. A module that compresses complexity well is easy for other developers to get started with since they don't need to understand all of the module's bits and bytes, but still provides the option to override the defaults when more control is needed.

Thinking about modules like this really comes into its own when you start composing resources and other modules into higher level packages. These composed modules can create useful abstractions for platform patterns that are meaningful in whatever domain you're working in. [Gregor Hohpe](https://architectelevator.com/) has a [great example](https://techleadjournal.dev/episodes/157/) of this concept where a customer in the finance sector defines a `ledgered-database`, which composes and configures a handful of AWS services into a pattern which has a high degree of reusability. Users of this kind of module don't need to know about specific database or event routing technologies - nor how to plug them into each other - to be able to quickly add this capability to their application. Other examples could be...

- `feature-store` for managing and serving machine learning features, including services for storage, pipelines, versioning, and API hosting
- `workflow-orchestrator` for defining and managing business workflows, including services for queueing, triggers, state management, and observability
- `policy-enforced-api` for hosting secured API services, including an API gateway, authentication, policy enforcement (such as rate limiting policies), monitoring, and encryption and compliance

These kinds of modules carry a lot of value, so look for opportunities to create them. But be mindful that they only carry value if they are actively used, so all the more reason to think carefully about the user experience. You don't want to fall into the [trap of competing standards](https://xkcd.com/927/)!

#### 4. Structure your terraform code with modules, stacks, and deployments

This is about as prescriptive as I'm going to get. When your terraform code base gets bigger you need to think about how to structure it. This structure, based on three top-level folders, is one that I find works really well. These folders are:

- `modules`: Contains small modules that describe individual resources, or combinations of a small number of resources to include for example private networking, or managed identities.
- `stacks`: Contains larger modules that compose smaller modules into solutions (this is where you might find one of the higher order modules I talked about in the last section). Stacks hold the complexity of the relationships between different resources, and often include code to facilitate those relationships - creating secrets, role assignments, that kind of thing. Stacks also control how much variation there can be between environments by exposing as many or as few variables as needed.
- `deployments`: Consumes stacks and represent individual _instances_ or _environments_ of a specific stack. This is where you'll find terraform `backend` and `provider` configurations, and whatever details that are different between environments (such as naming or sizing parameters).

This is the kind of structure you end up with:

```
terraform/
├── modules/
│   ├── app_service/
│   ├── sql_database/
│   ├── storage_account/
│   ├── virtual_network/
│   └── key_vault/
├── stacks/
│   ├── app1/
│   └── app2/
│   └── shared_service/
├── deployments/
│   ├── app1/
│   │   ├── dev/
│   │   ├── test/
│   │   └── prod/
│   └── app2/
│       ├── dev/
│       ├── test/
│       └── prod/
│   └── shared_service/
│       ├── dev/
│       ├── test/
│       └── prod/
```

Here's a more visual representation:

![Visualisation of modules, stacks, and deployments](/terraform-structure.svg)

> Note - whilst proofreading this post I discovered that Hashicorp have launched a new beta feature called "stacks" in their Terraform cloud product - this is unrelated to the "stacks" I refer to in this section, although they are conceptually very similar.

That's all I have for now. Just remember - Infrastructure as Code can, and **should be**, developer friendly!
