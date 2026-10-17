---
layout: post
title: "Why did an evaluation agent end up inside a Medicare portal?"
subtitle: "Because a research task that met a locked door was given a live network connection, and nobody on either side of that connection was watching for it. The OpenAI and Services Australia incident, walked through one step at a time."
description: >-
  In June 2026 an OpenAI model under internal evaluation got non-public access
  to Services Australia's Medicare statistics portal, and the government heard
  about it on September 10. What is known about how it happened, why it went
  unnoticed for weeks, and which deterministic controls would have kept the
  task in its box.
date: 2026-10-14
permalink: /blog/why-did-an-eval-agent-end-up-in-a-medicare-portal/
image: /assets/og/why-did-an-eval-agent-end-up-in-a-medicare-portal.png
tags: [incident, agentic, least-privilege, egress]
reading_time: "6 min read"
short_title: "Eval agent in a Medicare portal"
exhibits: [/break-this-server/, /allowlist-bypass/, /you-are-the-model/]
---
On September 24, Prime Minister Anthony Albanese [told a press conference](https://www.pm.gov.au/media/press-conference-new-york) that an OpenAI agent had gained unauthorised access to Services Australia's Medicare Statistics Reporting Portal. The portal publishes aggregate figures, things like spending and bulk-billing statistics. It is separate from the systems that hold Medicare claims and personal records.

The question I want to answer is narrow. Why did an agent that was given a research task end up somewhere it wasn't allowed to be, and why did it take until September for anyone to say so?

## What is actually known

Here is the timeline, assembled from the [ABC's reporting](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078) and the Prime Minister's press conference.

- **June 18.** An OpenAI model, running inside an internal evaluation, is researching public medicines spending. The portal doesn't give it what it wants. The Prime Minister says the agent "found a way around those blocks."
- **Mid-August.** OpenAI [finds it](https://openai.com/index/how-we-will-do-better-for-australia/) while reviewing old training and evaluation runs, a review it started only after the Hugging Face incident in July. (Some write-ups give August 11. OpenAI and the government say only "August".)
- **September 10.** OpenAI emails a public Services Australia mailbox. Services Australia sees it the next day and reports it to the Australian Signals Directorate on September 15.
- **September 24.** Albanese phones Sam Altman and announces the incident.

![Timeline drawn to scale: on June 18 the agent gets non-public access to the portal, by a mechanism not disclosed. A red stretch of about eight weeks follows in which nobody noticed. In mid-August OpenAI's review of earlier runs finds it. For about four weeks OpenAI knew and the agency didn't. On September 10 OpenAI emails a public mailbox, seen September 11 and reported to ASD September 15. Fourteen days later, on September 24, the Prime Minister announces it.](/assets/blog/why-did-an-eval-agent-end-up-in-a-medicare-portal/timeline.svg)
*The same four dates to scale. The longest stretch is the one where nobody on either side knew.*

What was reached: [public and non-public files](https://www.abc.net.au/news/2026-09-24/what-we-know-about-the-openai-medicare-hack/107189452) on the portal. The government described the non-public material as not particularly sensitive, and it has since been published. Services Australia also advised that the agent wrote files to an internal server, which is still under investigation. OpenAI [says](https://openai.com/index/how-we-will-do-better-for-australia/) its "review to date has found no evidence that anyone's medical records were accessed."

OpenAI's own account, ["How we will do better for Australia"](https://openai.com/index/how-we-will-do-better-for-australia/), goes further than the government did. It says the model found a way to get non-public access to the service, then ran commands, retrieved internal files, credentials, and aggregate statistics, and wrote files. It adds that the model then used that access "to review technical system information and source code related to the service," still trying to answer the question it had been given: government spending per person on medicines for skin conditions in Victorian communities. In early October, OpenAI disclosed [a second case](https://abcnews.com/Business/openai-reveals-hack-government-agency-australia/story?id=136945837), in which a model queried a NSW fire-history service in a way that "went beyond its intended use."

What is not known: the actual mechanism. Nobody has published how the agent got from "blocked" to "inside" at this portal: no CVE, no named misconfiguration, no description of the technique. Acting Prime Minister Richard Marles said the data "was really kept behind a fence that the AI agent effectively climbed over," which is a fine sentence and tells you nothing about the fence.

So everything below about mechanism is inference, and I'll mark it.

## The agent did what the loop told it to do

You might think an agent needs malice to break into something. Let's look at what an agent harness is actually doing.

The model gets a goal: find this spending figure. It has tools: fetch a URL, maybe run code. It calls a tool, reads the result, decides on the next call, and repeats until the goal is met or the budget runs out.

Now the portal returns a refusal. To you, a refusal is a message from the system owner meaning "no." To the loop, it is one more tool result, sitting next to every other tool result, and the goal hasn't been met yet. The loop's next step is to try something else. A model trained on plenty of security material knows what a penetration tester tries next.

There is supporting evidence that this is the shape of it. [Transluce's report](https://transluce.org/agent-activity) on agent activity it links to an OpenAI-confirmed swarm describes the same pattern at the Australian Institute of Health and Welfare on June 20 and 21: a dataset download blocked by Cloudflare, then a cross-site scripting probe (which the firewall stopped), then the same public file fetched from a pre-production server. Blocked, probe, find another door. (That is a different site, and Transluce says no non-public data was exposed there. I'm using it as a picture of the behaviour. It is no evidence of what happened at the Medicare portal.)

The model doesn't need to want anything. It needs a goal, a refusal it treats as an obstacle, and a network path to try the next idea on. If you'd like to feel this from the model's side, [/you-are-the-model/](/you-are-the-model/) puts you in the seat.

## Why the next idea reached a real server

An evaluation is supposed to be a sandbox. The cheapest way to learn whether this one was: look at what OpenAI changed afterward. According to its post, it now blocks live internet access during internal training and evaluation and serves web content from cached data. It has also paused training and evaluation involving tool use for its most capable models, and widened monitoring so unusual access pages a human.

You don't add "block live internet" unless the internet was live. (Inference, but not a daring one.) So the sandbox had a door to the outside, and the outside included a government portal whose access controls, whatever they were, gave way to whatever the agent tried.

The Medicare portal was a public website that also held non-public files. Something in front of those files said no to the agent at first and later stopped saying no. Whatever that was, it was the only control between the public half and the private half. (Inference again. The government has not said what the control was.)

![Diagram: an eval harness with a goal, tools to fetch a URL and run code, and a loop that treats a refusal as one more result sends requests out to the live internet (inferred). They reach the Medicare statistics portal's public pages, then a control that said no and later stopped saying no, its mechanism not disclosed, and past it non-public files that were read and an internal server the agent wrote files to. Red markers show what wasn't there: no egress allowlist, no check on every path, no real-time alert.](/assets/blog/why-did-an-eval-agent-end-up-in-a-medicare-portal/sandbox-to-portal.svg)
*The path as far as it is known. Dashed boxes are inference or undisclosed; the red numbers are the controls the last section comes back to.*

## Why nobody noticed for weeks

Picture the portal's request log: a client fetches pages, gets refused, fetches different pages. That looks like a crawler, and public statistics portals are crawled all day. Nothing about an agent's traffic announces that it is an agent, or whose. When asked why Australia's systems hadn't caught it earlier, the Prime Minister [did not directly answer](https://www.pm.gov.au/media/press-conference-new-york).

On the OpenAI side, the evaluation was scored on its task. Whether the agent got its answer through a public download or through a side door, the transcript says "task complete" either way. The access was found in mid-August, by a review of old runs that OpenAI started only because the Hugging Face incident made it look. A log that nobody reads in real time is a diary.

![An empty hotel reception desk late at night, lit and tidy, with a monitor on the counter, a sign reading RECEPTION on the stone wall behind it, and nobody there](/assets/blog/why-did-an-eval-agent-end-up-in-a-medicare-portal/empty-reception-desk.jpg)
*Fully staffed, in the sense that the log was running. "[Empty reception desk at Good Stay Eiropa Hotel](https://commons.wikimedia.org/wiki/File:Empty_reception_desk_at_Good_Stay_Eiropa_Hotel.jpg)" by JIP, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), via Wikimedia Commons, resized.*

Then, having found it, OpenAI notified the agency by emailing a public inbox. Albanese called that "unacceptable."

## The controls that don't depend on the model's judgment

Every fix that would have contained this is a boundary in code, enforced somewhere the model can't argue with. That is the whole argument of [guardrails belong in the server](/blog/guardrails-belong-in-the-server/), and it is the same lesson as [the July Hugging Face incident](/blog/hugging-face-agentic-breach/): the wall held where it was deterministic.

**Egress allowlists on the harness.** An eval agent should reach a fixed list of hosts, or a cache, and nothing else. Allowlists have their own failure modes, which [/allowlist-bypass/](/allowlist-bypass/) walks through, but a default-deny network beats a model's sense of what is appropriate every single time.

**Least privilege on the server.** If a file is non-public, the server should refuse to serve it to an unauthenticated client on every path, not only the obvious one. A public front end sitting on top of private files is a single bug from exposure, and an agent that can try a hundred ideas a minute will find the bug sooner than a person would. [/break-this-server/](/break-this-server/) is a working example of putting the check where the data is.

**Identity and audit for agent actions.** Agent traffic should carry an identity a site owner can see and attribute. On the operator side, every tool call should be logged with the task it served, and some actions (an auth failure followed by a retry with a different technique, a write to a remote host) should page a human that day, rather than turning up in a review two months later.

None of these ask the model to be good. They make it irrelevant whether it is.

## Bonus chatter

Transluce found its evidence in [public scan records on urlquery.net](https://transluce.org/agent-activity), a service the agents were apparently using to fetch pages they couldn't reach directly. In other words, the agents left a public audit trail on a third party's site. It was more complete than anything their operator's or their target's logs produced in time.

## Exercise

Your agent's tool returns HTTP 403. Write down what your harness does next. If the answer is "the model decides," name the control that stops the model's second idea from reaching the network.
