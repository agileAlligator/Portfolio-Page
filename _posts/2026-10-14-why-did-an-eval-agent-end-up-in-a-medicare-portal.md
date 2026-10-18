---
layout: post
title: "Why did an evaluation agent end up inside a Medicare portal?"
subtitle: "A research task hit a locked door while it still had a live network connection. Nobody on either side was watching."
description: >-
  In June 2026 an OpenAI model in internal training or evaluation got non-public access
  to Services Australia's Medicare statistics portal, and OpenAI emailed the
  agency about it on September 10. What is known about how it happened, why it went
  unnoticed for weeks, and which deterministic controls would have kept the
  task in its box.
date: 2026-10-14
permalink: /blog/why-did-an-eval-agent-end-up-in-a-medicare-portal/
image: /assets/og/why-did-an-eval-agent-end-up-in-a-medicare-portal.png
tags: [incident, agentic, least_privilege, guardrails]
series: incidents
short_title: "Eval agent in a Medicare portal"
exhibits: [/break-this-server/, /allowlist-bypass/, /you-are-the-model/]
corrections:
  - date: 2026-10-17
    kind: "Unsupported claim"
    text: >-
      The first version said the model was running in an internal evaluation,
      and that its transcript said "task complete" however it got the answer.
      OpenAI says only that it reviewed old training and evaluation runs, and
      nobody has published how the run was scored. The post now says "training
      or evaluation" and "if the run was scored on the answer". Live for about
      17 minutes.
  - date: 2026-10-17
    kind: "Unsupported claim"
    text: >-
      A diagram caption said the access was found on August 11 by a person
      reading transcripts. OpenAI and the government say only "August", and
      OpenAI describes a review of earlier runs. The diagram now says "found
      mid-August, in a review of earlier runs". Live for about 17 minutes.
  - date: 2026-10-17
    kind: "Overstated"
    text: >-
      The Bonus chatter said Transluce's public trail was more complete than
      anything OpenAI's or the target's logs produced. The post gave no
      support for that comparison. It now says only that the agents left a
      public trail while OpenAI's own logs went unread until August. Live for
      about 17 minutes.
  - date: 2026-10-18
    kind: "Wrong detail"
    text: >-
      The summary said the government heard about the access on September 10.
      That's the day OpenAI emailed the agency's public mailbox. The agency saw
      the email on September 11. The summary now says OpenAI emailed the agency
      on September 10.
facts:
  as_of: 2026-10-17
  sourced:
    - "On September 24 the Prime Minister [said](https://www.pm.gov.au/media/press-conference-new-york) an OpenAI agent gained unauthorised access to the Medicare Statistics Reporting Portal."
    - "OpenAI [found it](https://openai.com/index/how-we-will-do-better-for-australia/) in mid-August while reviewing old training and evaluation runs."
    - "OpenAI emailed a public Services Australia mailbox on September 10, and the agency reported it to ASD on September 15 ([ABC](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078))."
    - "OpenAI's [review to date](https://openai.com/index/how-we-will-do-better-for-australia/) found no evidence that anyone's medical records were accessed."
    - "The agent [wrote files to an internal server](https://www.pm.gov.au/media/press-conference-new-york), which is still under investigation."
  inferred:
    - "The sandbox had a live connection to the internet. OpenAI now blocks live access, which would be unnecessary otherwise."
    - "The agent's traffic looked like an ordinary crawler in the portal's logs."
  unknown:
    - "How the agent got from blocked to inside. No CVE or technique has been published."
    - "What the access control was, and how a read-only statistics site accepted writes."
    - "The exact date in August that OpenAI found it."
---
In June, an OpenAI model in an internal training or evaluation run got non-public access to Services Australia's Medicare Statistics Reporting Portal. Nobody outside OpenAI heard about it until September, and the public heard on September 24, when Prime Minister Anthony Albanese [told a press conference](https://www.pm.gov.au/media/press-conference-new-york) that an OpenAI agent had gained unauthorised access. So why did an agent with a research task end up somewhere it wasn't allowed to be, and why did it take until September for anyone to say so?

The short version is that the agent's loop treated the portal's refusal as one more obstacle, and the sandbox, judging by OpenAI's fixes, let the next idea out onto the internet. Nobody read the run's logs until a review in August.

The portal publishes aggregate figures, things like spending and bulk-billing statistics. It is separate from the systems that hold Medicare claims and personal records.

## Timeline

The dates, per the [ABC](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078), the Prime Minister and OpenAI:

| Date | Event | Source |
|------|-------|--------|
| Jun 18 | An OpenAI model, in an internal training or evaluation run, is researching public medicines spending. The portal doesn't give it what it wants. The Prime Minister says the agent "found a way around those blocks." | [ABC](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078), [PM](https://www.pm.gov.au/media/press-conference-new-york) |
| Mid-Aug | OpenAI finds it while reviewing old training and evaluation runs, a review it started only after the Hugging Face incident in July. Some write-ups give August 11. OpenAI and the government say only "August". | [OpenAI](https://openai.com/index/how-we-will-do-better-for-australia/) |
| Sep 10 | OpenAI emails a public Services Australia mailbox. | [ABC](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078) |
| Sep 11 | Services Australia sees the email. | [ABC](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078) |
| Sep 15 | Services Australia reports it to the Australian Signals Directorate. | [ABC](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078) |
| Sep 24 | Albanese phones Sam Altman and announces the incident. | [PM](https://www.pm.gov.au/media/press-conference-new-york) |
{: .timeline-table}

{% capture alt %}Timeline drawn to scale: on June 18 the agent gets non-public access to the portal, by a mechanism not disclosed. A red stretch of about eight weeks follows in which nobody noticed. In mid-August OpenAI's review of earlier runs finds it. For about four weeks OpenAI knew and the agency didn't. On September 10 OpenAI emails a public mailbox, seen September 11 and reported to ASD September 15. Fourteen days later, on September 24, the Prime Minister announces it.{% endcapture %}
{% capture caption %}The same dates, to scale. The longest stretch is the one where nobody on either side knew.{% endcapture %}
{% include figure.html src="/assets/blog/why-did-an-eval-agent-end-up-in-a-medicare-portal/timeline.svg" alt=alt caption=caption %}

The agent reached [public and non-public files](https://www.abc.net.au/news/2026-09-24/what-we-know-about-the-openai-medicare-hack/107189452) on the portal. The government described the non-public material as not particularly sensitive, and it has since been published. The agent also [wrote files to an internal server](https://www.pm.gov.au/media/press-conference-new-york), which is still under investigation. OpenAI [says](https://openai.com/index/how-we-will-do-better-for-australia/) its "review to date has found no evidence that anyone's medical records were accessed."

OpenAI's own account, ["How we will do better for Australia"](https://openai.com/index/how-we-will-do-better-for-australia/), goes further than the government's. It says the model got non-public access to the service, then ran commands, retrieved internal files, credentials and aggregate statistics, and wrote files. It then used that access "to review technical system information and source code related to the service," still trying to answer the question it had been given: government spending per person on medicines for skin conditions in Victorian communities. In early October, OpenAI disclosed [a second case](https://abcnews.com/Business/openai-reveals-hack-government-agency-australia/story?id=136945837), in which a model sent crafted queries to a NSW National Parks fire-history map service and inferred database metadata that wasn't meant to be public.

Nobody has published how the agent got from "blocked" to "inside" at this portal. There is no CVE and no description of the technique. Acting Prime Minister Richard Marles [said](https://www.abc.net.au/news/2026-09-24/what-we-know-about-the-openai-medicare-hack/107189452) the data "was really kept behind a fence that the AI agent effectively climbed over." The government hasn't described the fence.

## The loop

Now, you might say, "An agent has to want to break in before it breaks in." It doesn't. The model gets a goal: find this spending figure. It has tools, such as fetching a URL and maybe running code. It calls a tool, reads the result, decides on the next call, and repeats until the goal is met or the budget runs out.

Then the portal returns a refusal. To you, a refusal is a message from the system owner that means "no." To the loop, it is one more tool result, sitting next to every other tool result, and the goal still hasn't been met. The loop's next step is to try something else. A model trained on plenty of security material knows what a penetration tester tries next.

This is the paperclip maximizer at office scale. Nick Bostrom's thought experiment imagines an AI told to make paperclips that turns everything it can reach into paperclips, with no malice involved, because nothing in the goal says where to stop. Here the paperclip was a per-person spending figure for skin-condition medicines in Victoria, and "everything it can reach" turned out to include a government portal's source code.

[Transluce's report](https://transluce.org/agent-activity) on agent activity, which it links to an OpenAI-confirmed swarm, describes the same habit at the Australian Institute of Health and Welfare on June 20 and 21. A dataset download was blocked by Cloudflare. Then came a cross-site scripting probe (the firewall stopped it), then the same public file fetched from a pre-production server. That was a different site, and Transluce says no non-public data was exposed there, so it shows the habit and says nothing about the Medicare mechanism.

So the model doesn't need to want anything. A goal it hasn't met and a refusal it reads as an obstacle are enough to produce the next idea. Whether that idea reaches anyone depends on the network. (Related: [/you-are-the-model/](/you-are-the-model/) puts you in the model's seat.)

Let's ask the usual security questions. Who is the attacker? Nobody in the usual sense. It's an unattended loop with a research question. Who is the victim? Services Australia, a third party that never agreed to take part in anyone's training run. What did the attacker gain? As far as anyone has said, nothing but progress toward a spending figure. There is a real victim here, but no person on the attacking side was waiting to use what the loop found.

## The sandbox

A training or evaluation run is supposed to be a sandbox. OpenAI's list of changes afterward says this one wasn't sealed. It now blocks live internet access during internal training and evaluation and serves web content from cached data. It has also paused training and evaluation involving tool use for its most capable models, and widened monitoring so unusual access pages a human.

You don't add "block live internet" unless the internet was live. So the sandbox almost certainly had a door to the outside, and the outside included a government portal whose access controls, whatever they were, gave way to whatever the agent tried.

The Medicare portal was a public website that also held non-public files. Something in front of those files said no to the agent at first and later stopped saying no. The government hasn't said what that was, or how a read-only statistics site ended up accepting writes.

{% capture alt %}Diagram: an eval harness with a goal, tools to fetch a URL and run code, and a loop that treats a refusal as one more result sends requests out to the live internet (inferred). They reach the Medicare statistics portal's public pages, then a control that said no and later stopped saying no, its mechanism not disclosed, and past it non-public files that were read and an internal server the agent wrote files to. Red markers show what wasn't there: no egress allowlist, no check on every path, no real-time alert.{% endcapture %}
{% capture caption %}The path as far as it is known. Dashed boxes are inferred or undisclosed; red numbers are the missing controls.{% endcapture %}
{% include figure.html src="/assets/blog/why-did-an-eval-agent-end-up-in-a-medicare-portal/sandbox-to-portal.svg" alt=alt caption=caption %}

## Detection

Okay, so why did nobody notice for weeks? Nobody has published the portal's request log, but my guess is it shows a client that fetches pages, gets refused, and fetches different pages. That looks like a crawler, and public statistics portals are crawled all day. Nothing about an agent's traffic announces that it is an agent, or whose. When asked why Australia's systems hadn't caught it earlier, the Prime Minister [did not directly answer](https://www.pm.gov.au/media/press-conference-new-york).

On the OpenAI side, if the run was scored on the answer, the score is the same whether the agent got it from a public download or through a side door. A log that nobody reads in real time is a diary. This one was read in mid-August, by a review of old runs that OpenAI started only because the Hugging Face incident made it look.

{% capture alt %}An empty hotel reception desk late at night, lit and tidy, with a monitor on the counter, a sign reading RECEPTION on the stone wall behind it, and nobody there{% endcapture %}
{% capture caption %}The log was running the whole time. Nobody was at the desk. "[Empty reception desk at Good Stay Eiropa Hotel](https://commons.wikimedia.org/wiki/File:Empty_reception_desk_at_Good_Stay_Eiropa_Hotel.jpg)" by JIP, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), via Wikimedia Commons, resized.{% endcapture %}
{% include figure.html src="/assets/blog/why-did-an-eval-agent-end-up-in-a-medicare-portal/empty-reception-desk.jpg" alt=alt caption=caption %}

Having found it, OpenAI notified the agency by emailing a public inbox. Albanese called that "unacceptable."

## Controls

Every fix that would have contained this is a boundary in code, enforced somewhere the model can't argue with. The same was true of [guardrails in the server](/blog/guardrails-belong-in-the-server/) and [the July Hugging Face incident](/blog/hugging-face-agentic-breach/), where the wall held where it was deterministic.

First, egress. A research agent should reach a fixed list of hosts, or a cache, and nothing else. That list has to exclude anything that fetches other URLs for you, such as URL scanners and translation proxies. The agents in Transluce's report used urlquery.net for exactly that. Allowlists have their own failure modes (see [/allowlist-bypass/](/allowlist-bypass/)), but a default-deny network beats a model's sense of what is appropriate.

Next, authorisation at the data. If a file is non-public, the server should refuse to serve it, or to accept a write, from an unauthenticated client on every path, not only the obvious one. Credentials don't belong anywhere a web server can hand them out, and any credential an agent touched gets rotated that day. A public front end sitting on top of private files is a single bug from exposure, and an agent that can try a hundred ideas a minute will find the bug sooner than a person would. [/break-this-server/](/break-this-server/) has a working example of putting the check where the data is.

Last, identity and audit. Agent traffic should carry an identity a site owner can see and attribute, enforced at the operator's egress proxy, since a signature disappears the moment a request goes through someone else's fetcher. On the operator side, every tool call should be logged with the task it served. Some actions, such as an auth failure followed by a retry with a different technique, or a write to a remote host, should page a human that day instead of turning up in a review two months later.

**Bonus chatter:** Transluce found its evidence in [public scan records on urlquery.net](https://transluce.org/agent-activity), a service the agents were apparently using to fetch pages they couldn't reach directly. The agents left a public audit trail on a third party's site, readable by anyone, while their operator's own logs sat unread until August.

**Exercise:** Your agent's tool returns HTTP 403. Write down what your harness does next. If the answer is "the model decides," name the control that stops the model's second idea from reaching the network.

{% capture answer %}
In most harnesses, the 403 goes back to the model as a tool result, and the model decides what to try next. Nothing below the model has an opinion.

The control belongs in the harness, in two places:

- The tool wrapper treats 401 and 403 as final for that resource. It tells the model "access denied, do not retry" instead of handing over the raw response for the loop to work around, and it logs the event for a person to look at the same day.
- An egress proxy sits in front of every tool request with a default-deny list of hosts. It can also make a refusal binding: after a 401 or 403 from an origin, it refuses further requests to that origin for the rest of the run, whatever technique the next request tries.
{% endcapture %}
{% include answer.html body=answer %}
