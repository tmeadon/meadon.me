---
title: "Testing PowerShell Azure Functions Part 1: Unit testing"
date: 2020-11-08T10:48:01Z
draft: true
series: "Testing PowerShell Azure Functions"
---
Azure Functions provide a great way to run your PowerShell code, but how can you be sure that what you have built does what you intended it to do? Can you guarantee that the functionality you have built won't break when you or someone else adds or makes changes to the code at a later date?

The answer is yes - with testing!  This 3 part series explains some of the ways that we can test PowerShell Azure Functions, covering unit testing, integration testing and finally test automation.  For this article we'll starting at the bottom of the [Testing Pyramid](https://automationpanda.com/2018/08/01/the-testing-pyramid/) - with unit tests.

## What, how and why?

What are unit tests?  Well, for a start, I'm not going to pretend to be able to offer the best explanation on the web - for a more detailed explanation I would recommend going over to [softwaretestingfundamentals.com](https://softwaretestingfundamentals.com/unit-testing/) or [edureka.co](https://www.edureka.co/blog/what-is-unit-testing) who both have good articles on the topic.  To summarise though, unit testing is about taking each individual piece of logic in your code, isolating them and validating they all individually do what they're supposed to do.  This is normally done by executing each unit (usually individual functions or methods) with a sample input and then comparing the actual output to the expected output - if it matches then the test passes.  Unit tests should be simple, fast and ideally small; the smaller the test the easier it is to see exactly what's broken.  This does add an onus on the code however: it needs to be written in such a way that allows you to write small tests and isolate each piece of logic.  We'll cover that in the next section.

That covers the 'what' and the 'why' but what about the 'how'?  Well if you're non familiar with [Pester](https://pester.dev/) then you should know that it is the de facto standard testing framework for PowerShell - we'll be using Pester v5 in the example in this series to write and run our tests.

## Writing testable code

## Testing a basic HTTP Function

