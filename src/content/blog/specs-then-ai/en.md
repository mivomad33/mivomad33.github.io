---
title: I Write the Plan and Requirements, AI Does the Rest
description: After trying to decide everything up front, then reviewing one step at a time, I settled on writing only airtight plans and requirements and handing everything else to AI. Here is how I got there and the four skills I use.
date: 2026-10-25
---

This is how I build software these days. I write the plan and the requirements with no gaps, then hand design and implementation to AI (Claude Code) all the way to the end. The large pieces of work on [Senseful](/en/blog/building-senseful/) and [Wonbook](/en/blog/building-wonbook/) were done this way.

For a simple project, one day is enough to get from start to a deployed, public site. It used to take several days. I changed my approach twice before landing here.

## Two approaches I left behind

At first I decided everything up front, down to the architecture and the development process. Implementation went worse, not better. Perhaps because there were too many instructions, the AI kept skipping some of them, and for all that up-front work, the plan and requirements still had many gaps. Testing, verifying, and fixing things again took a lot of time.

Next I threw all of that away. I designed only the next step, reviewed everything myself, and moved forward one step at a time. The results were fine, but it took far too long.

## Now: decide once, hand off the rest

So I gathered the human work into one place. I write only the plan and requirements, as much as possible in one go, carefully and without gaps. Everything else goes to the AI. In practice it was faster, and the results were much better.

I call this document an **autonomous implementation spec**. It is a planning and requirements document in which every human decision and every prerequisite is settled before implementation is handed to AI. It has a single goal:

> Leave no point where the implementing AI stops, guesses at a decision that belongs to the user, or breaks something it must keep.

Design (schemas, libraries, folder structure) and the work plan stay out of the spec; the implementing AI decides them. As my first approach showed, adding more instructions did not make the results better. What the spec does settle are structures that change cost or deployment, structures that are hard to undo later, and technology choices such as language, hosting, and database.

## Four skills

I turned this process into four Claude Code skills (instructions you set up once and invoke when needed) and use them in every project.

1. **`write-spec`: ask and decide.** Once implementation starts there is no one to ask, so every human decision is made here. It asks about open items, most important first, up to three at a time, with the impact of each option and a recommendation. The first round always includes an open question: "Is there anything you are worried about, anything that must not happen, or any trap you already know of?"
2. **`review-spec`: repeated review with fresh eyes.** Each round, a new subagent reviews the spec, because without the previous round's context it does not get stuck in the same viewpoint. The main agent does not take findings at face value; it checks each one itself before fixing it, and gathers only the decisions that belong to a person into a single question. It keeps going until a round finds zero major problems (blocking or important), and after any round that fixed one, it runs one more round to confirm.
3. **`implement-spec`: no questions, all the way through.** It decides anything the spec leaves open, and when a requirement can be read two ways it takes the stricter reading. It stops only in cases defined in advance. Done means each requirement's check was actually run and passed, and at the end a subagent that took no part in the implementation compares the spec with the result.
4. **`browser-check`: click through it like a person.** Automated tests only cover the scenarios someone thought of in advance. So this skill pulls a list of requirements from the documents and clicks through the app in a browser in the development environment until every item is confirmed. Bugs it finds are fixed and kept as E2E tests. Real-use verification is done without me clicking through everything, so I can trust the result more.

## What every spec must include

The three spec skills share one criteria file. Here are a few of its key rules.

- **Every requirement has a "check".** The implementing AI must be able to actually run it. Instead of "works well", it says what to do and what should appear, and an automated test is the default.
- **Requirements have no priorities.** All of them must be met, so words like "if possible" or "where feasible" are not allowed.
- **Decisions also record the rejected options and why.** That keeps the implementing AI from bringing the same option back.
- **Prerequisites are written as finished results.** Accounts, keys, permissions, and external service settings are done before implementation. Only what the AI cannot do, such as signing up or logging in, payment, or entering secrets, is left to a person, and the approvals needed are collected at once.
- **The working rules include pre-approvals and stop conditions.** Costs it may spend without asking (with a cap), pushing and deploying, and changes to external services are approved in advance, and it stops only when it needs something else.
- **The definition of done has two parts:** "the AI verifies and finishes" and "the user checks at the end".

## How it has gone

So far I have written 6 specs for Senseful (public deployment, generating reading passages, and more; one is still being written) and 3 for Wonbook (public deployment, a design refresh, and a README skill). They all went well enough that no single one stands out.

The review step always found a lot, including many critical problems. Left to repeat on its own with subagents, the spec was at a fairly high level by the time the rounds ended.

## When I don't use it, and its limits

A spec takes effort to write and review. So I don't use one for work I can finish in a single session of conversation, or for small changes where I can see the result right away and fix it. Just doing it is faster.

The criteria file's list of easy-to-miss areas comes from past experience, so it cannot catch a kind of work I have never done before. The check that walks through the implementation from start to finish is also the same model imagining, so it cannot find traps that model does not know about. That is why it is paired with the open question and with reviews by fresh subagents.

The criteria change as I use them. The implementing AI records what the spec missed and proposes additions to the criteria at the end, and only the ones I approve go in. When the list grows long, checking against it becomes a formality, so each addition comes with merging or removing items to keep it short.
