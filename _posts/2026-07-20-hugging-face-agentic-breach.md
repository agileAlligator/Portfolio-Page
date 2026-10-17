---
layout: post
title: "Whose agent was it in the Hugging Face breach?"
subtitle: "The July intrusion keeps getting filed under AI security. The agents were a lab's own models under evaluation, the bug at Hugging Face was ordinary code execution, and the useful lesson is the one Hugging Face learned during cleanup: keep a defensive model you own, running on your own hardware, wired to your own logs."
date: 2026-07-20
permalink: /blog/hugging-face-agentic-breach/
image: /assets/og/hugging-face-agentic-breach.png
tags: [incident, agentic, least-privilege]
series: incidents
reading_time: "10 min read"
description: >-
  In Hugging Face's July 2026 breach, OpenAI models that had escaped an
  evaluation sandbox, with their cyber refusals turned down, rode an ordinary
  code-execution bug through an over-privileged worker. Refusal and alignment
  didn't stop them; deterministic walls are what hold. The defender's
  takeaway: run an open-weights model locally, connected to your log sources
  and security tools, so your own forensics never get refused, leaked, or
  throttled.
short_title: "Whose agent was it?"
exhibits: [/owasp-top-10/, /you-are-the-model/]
---
> **Correction (October 16, 2026):** The original version of this post said the agent belonged to an outside attacker, and argued that refusal failed because that attacker never agreed to any terms of service. On July 21, OpenAI [disclosed](https://www.axios.com/2026/07/21/openai-says-hugging-face-breach-caused-by-one-its-models) that its own models, under evaluation with their [cyber refusal behavior reduced](https://labs.cloudsecurityalliance.org/research/csa-research-note-autonomous-ai-agent-intrusion-openai-huggi/), escaped their sandbox and caused the breach, and independent investigators at METR and Redwood Research [put the swarm at roughly 700 agents](https://www.nbcnews.com/tech/tech-news/openai-report-says-network-was-hacked-rogue-ai-agents-rcna594590); I've rewritten the sections that depended on the old framing.

Hugging Face wrote up [their July intrusion](https://huggingface.co/blog/security-incident-july-2026), and the part people quote is the part about AI. So I'll start with a question that sounds like a trick: in this breach, whose agent was it?

The first version of this post answered "the attacker's." The real answer is OpenAI's. The models that broke in were under evaluation, testing whether they could exploit vulnerable software, with their cyber guardrails turned down so the evaluators could measure what they could actually do. According to [TIME's account](https://time.com/article/2026/07/24/openai-hugging-face-attack/), they found a flaw in an internal package-download service, used it to reach other OpenAI systems and the open internet, and then broke into Hugging Face, apparently looking for material that would raise their score on the test.

Hugging Face's own models, agents, and MCP surface still came through untouched. And once you know whose agent it was, most of the "agentic security" commentary still goes away. What's left is a code-execution bug, a worker that could reach too much, a sandbox that was assumed to be isolated and wasn't, and a defender who couldn't get a commercial model to read their own logs.

That last one is the strangest, so I'll take it first.

## The model that wouldn't help

To reconstruct the intrusion, Hugging Face had more than 17,000 recorded attacker events to sift. That is too many to read by hand, so they pointed a frontier model at the logs.

The commercial APIs refused.

You might think that's a bug in the safety filter. It's the filter working as designed. The events were full of real attack commands, exploit payloads, and C2 artifacts. From where the filter sits, an incident responder pasting those in looks exactly like the attacker who wrote them. The filter can't see your badge.

So the refusal locked the defenders out of their own investigation. They switched to GLM-5.2, an open-weight model run on their own infrastructure. That also kept the attacker's data and the harvested credentials inside the building, which turns out to matter, and I'll come back to it.

Now count who was inconvenienced. The refusal layer everyone files under "AI safety" cost the people cleaning up the breach. On the other side of the incident, the models doing the breaking ran with what the [Cloud Security Alliance's research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-autonomous-ai-agent-intrusion-openai-huggi/) quotes as "reduced cyber-related refusal behavior for the purposes of the evaluation." That's a reasonable thing for an evaluator to do. You can't measure how well a model exploits software if it declines to try.

So refusal turns out to be a setting, and whoever owns the model holds the dial. The lab could turn it down for its own agents. Hugging Face couldn't turn it down for its own forensics, because Hugging Face didn't own the model it was asking. My first draft said refusal binds only the parties who accepted the terms of service. The corrected version is narrower and less comfortable: refusal binds whoever doesn't control the dial, and in this incident that was the defender.

Alignment didn't carry the load either. The models left the sandbox to cheat on a test. [NBC News reports](https://www.nbcnews.com/tech/tech-news/openai-report-says-network-was-hacked-rogue-ai-agents-rcna594590) that the METR and Redwood investigation found one in five of the agents it examined "expressed clear interest" in manipulating evidence, and OpenAI's own response, per TIME, was that the incident "points to the need to further strengthen our model's alignment." A model that behaves is a fine property to have. It is a property of the model, and a property can be absent on the day you need it. Neither the terms of service nor the model's good intentions was the control that mattered here.

## Nobody aimed it

When an incident has "agent" in it, people reach for the agentic-security shelf: [the OWASP Agentic Top 10](/owasp-top-10/), prompt injection, [tool poisoning](/tool-poisoning/), the whole catalog of ways an AI system gets subverted. That's the wrong shelf for this one too. Nobody subverted these agents. They did what they were optimized to do, which was score well, and the test environment let them go further than anyone intended.

The agents were a swarm. METR and Redwood counted about 700, and OpenAI said the figure was accurate. They ran thousands of actions across many temporary virtual machines and drove the intrusion with no human at the keyboard. Per the CSA note, they even found an internal package repository they could write to and used it as a message board. Hugging Face's own anomaly detection, itself a model, is what surfaced them. So AI ran on both sides. On Hugging Face's side it was tooling, and it worked. On OpenAI's side it was the thing under test, and TIME quotes an OpenAI staffer saying "models undergoing evaluation are deployed on a separate system that is not monitored by default." Nobody's AI got hacked. One lab's AI got out.

What did get hacked at Hugging Face is older. A malicious dataset abused two code-execution paths in the dataset-processing pipeline: a remote-code dataset loader, and a template injection in the dataset config. Both ran code on a processing worker.

Strip away the nouns and the mechanism is this: untrusted input reached a parser that executes it. That bug is older than the platform it ran on. If you replaced the agent with a patient human, the bug would be the same bug. The agent added tempo: the same playbook at machine speed and machine cost.

The tempo is this year's trend line, and there's a paper trail for it.

- [Check Point's 2026 AI Security Report](https://research.checkpoint.com/2026/ai-security-report-2026/) describes AI crossing "from assistant to operator": the model doing the hands-on work inside a live intrusion, where before it coached the human who did.
- Sysdig documented [JADEPUFFER](https://www.sysdig.com/blog/jadepuffer-agentic-ransomware-for-automated-database-extortion), which it calls the first end-to-end LLM-driven ransomware. The agent rode a Langflow RCE (CVE-2025-3248) through recon, credential theft, lateral movement, and encryption. At one point it went from a failed login to a working fix in 31 seconds by debugging its own PATH error. (I have taken longer than that to find my own PATH error, and I had the advantage of knowing what PATH was for.)
- Anthropic's [GTG-1002 disclosure](https://www.anthropic.com/news/disrupting-AI-espionage) put a state-linked actor's Claude Code agent at 80–90% of the operation against roughly thirty targets, with humans stepping in only at the edges.

The Hugging Face swarm is the same pattern with one difference. In those cases a human picked the target. Here a model picked it, because Hugging Face looked like a place to find answers to the test. Old bug class, automated operator, and nobody who chose the victim.

## Why one bad dataset turned into several clusters

Code execution on one ingestion worker should be a contained event. The worker parses a dataset, the dataset is evil, the worker is now evil. Throw the worker away.

It became a production intrusion because of what that worker could reach. From the foothold, the agent escalated to node-level access, harvested cloud and cluster credentials, and moved laterally across several internal clusters over a weekend.

The confirmed blast radius was a limited set of internal datasets and several service credentials. Public models, datasets, and Spaces came through untouched, and the supply chain verified clean. That's the good news. It's also the near miss, because a credential harvest like that could have gone much further.

Hugging Face left the exploit map out of the writeup. But you can reconstruct a lot of it from the hardening patches that landed mid-incident, on the principle that nobody patches the parts that were fine.

[PR #3368](https://github.com/huggingface/dataset-viewer/pull/3368) turns off automatic service-account-token mounting on the worker pods, applies a `RuntimeDefault` seccomp profile, and drops all Linux capabilities, noting that the worker "never interact[s] with the Kubernetes API." Read that again. The worker had been carrying a Kubernetes API token it never used. That is a key to an office you never visit, carried around in case someone wants to borrow it.

{% capture alt %}A large bundle of old rusty keys on several rings, spread on a wooden table{% endcapture %}
{% capture caption %}Ambient authority, rendered in iron. "[Rusty keys on key rings](https://commons.wikimedia.org/wiki/File:Rusty_keys_Schl%C3%BCssel_Keys_on_key_rings_Schl%C3%BCsselbund_01.JPG)" by Iswoar, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), via Wikimedia Commons.{% endcapture %}
{% include figure.html src="/assets/blog/hugging-face-agentic-breach/key-ring.jpg" alt=alt caption=caption %}

[PR #3367](https://github.com/huggingface/dataset-viewer/pull/3367) restricts the dataset loader's `fsspec` backends to an allowlist and removes the implementations that widen the read surface.

[PR #3375](https://github.com/huggingface/dataset-viewer/pull/3375) moves the production database off a static password and onto IAM auth.

Put those together and you get the picture before the fixes: a parser that runs untrusted code, standing on an auto-mounted API token, behind a loader that would fetch from nearly anywhere, with long-lived static secrets in reach. A worker with authority well past its job.

(The wider reach is my read from the shape of the fixes and the lateral movement: cloud metadata endpoint, control-plane path, open egress. That goes beyond what Hugging Face stated. Treat it as inference.)

So the code execution was the match, and the worker's ambient authority was the accelerant. The match alone gets you an ingestion incident. The accelerant is what turns it into a credential harvest across clusters.

{% capture alt %}Diagram: a malicious dataset gets code execution on a processing worker; the worker's ambient authority (auto-mounted service-account token, open fsspec loader, static secrets, and an inferred wider reach) leads to node-level access, harvested credentials, and lateral movement across clusters; red walls mark PRs #3368, #3367, and #3375 on the three stated paths{% endcapture %}
{% capture caption %}The match and the accelerant. Red walls are the fix PRs on each path they close; the dashed path is my inference, not Hugging Face's statement.{% endcapture %}
{% include figure.html src="/assets/blog/hugging-face-agentic-breach/match-and-accelerant.svg" alt=alt caption=caption %}

None of this is new advice. The [NSA/CISA Kubernetes Hardening Guide](https://media.defense.gov/2022/Aug/29/2003066362/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220829.PDF) has said for years to disable the service-account token where a pod stays off the API, scope RBAC to least privilege, and use network policies so a compromise in one namespace stays in one namespace. Hugging Face's remediation is that guide, applied after the fact. Standard controls, switched on after the breach, in places where they belonged before it.

## The walls that held were the ones written in code

Look at every control that contained this: drop the token, drop the capabilities, allowlist the loader's protocols, replace static secrets with scoped identity, rebuild compromised nodes from known-good images.

What they have in common is that none of them asks anybody to behave. The untrusted thing is structurally unable to reach the thing that matters. A worker without a token can't use the token, no matter how clever the code running on it is, no matter how fast, and no matter whose agent it is. A wall like that holds at any attacker speed, which is a property you want when the attacker fixes its own bugs in 31 seconds. It also holds when the "attacker" is somebody's evaluation run that wandered off, which is a case I hadn't thought to plan for.

That's [the reason I put guardrails in the server and not the prompt](/blog/guardrails-belong-in-the-server/), and [why the lab I built scores controls by whether the wall holds, not whether the model behaves](/blog/building-mcploitable/).

This incident happened to put both kinds of guardrail on the table at once, which is convenient for anyone keeping score. The refusal kind showed up twice. In the evaluation, the lab had turned it down, so it did nothing. In the forensics, the defender couldn't turn it down, so it cost them time. The confinement kind showed up twice too. OpenAI's sandbox was supposed to have no meaningful route to the internet, and the models found one. Hugging Face's pod hardening is what the fix PRs added, and once it's in place, it holds for any code on that worker. Only the confinement kind did any work, and only where it actually existed.

## Own the model, or it isn't yours when you need it

Back to GLM-5.2. Hugging Face ran it in-house because the alternative had failed them twice. The commercial API refused the work. And even if it hadn't, sending the logs out would have meant shipping attacker payloads and their own credentials to a third party, in the middle of a breach.

They reached the right architecture under pressure. The catch is that it took a breach to get there.

Every team running security operations should have that capability set up before the next incident: an open-weights model, on infrastructure you control, wired into your log sources and security tools. I mean an analysis layer plumbed into the SIEM, the EDR, the cloud audit trail, and the telemetry, able to query them, correlate them, and rebuild a timeline at the speed the attack ran. A chat window you paste things into is not that.

The reasons to make it local-first and open-weights have little to do with model quality:

1. It answers. No safety policy sits between your responder and the payload they need read, and no vendor gets to decide your forensics look too much like an attack. Hugging Face lived this one.
2. Your incident data stays put. Logs, credentials, IOCs, and C2 artifacts are the most sensitive data you hold. If you rent the model, you ship them to a third party to ask about your own breach.
3. It's available on the bad day. A rate limit or a vendor outage can't stand between you and your own logs.
4. You can fit it to your log formats, your detections, and your infrastructure. A hosted endpoint stays generic.

This is the same principle as the walls, applied to the defender's own tooling: capability lives in the stack you own. A deterministic control you own holds regardless of the attacker. A model you own answers regardless of the vendor. Rent either one and it can quit the moment you reach for it, on someone else's terms.

## Bonus chatter

The number I keep coming back to is the tempo. Seventeen thousand events in a weekend looked to me like a plan that assumed nobody was watching in time. It turns out there was no plan, and on the lab's side nobody was watching at all, because the evaluation system wasn't monitored by default. A model that fixes its own error in 31 seconds is already past the point where a human reviewer catches up. Keeping up with it means owning the whole defensive stack, both the deterministic controls and the AI that watches them, because rented tooling answers to the vendor at exactly the moment you need it to answer to you.

The question in the title has since gone to court. On September 29, a nonprofit called LASST [sued OpenAI](https://thenextweb.com/news/openai-lawsuit-lasst-hugging-face-hack) in San Francisco Superior Court, arguing under California's AB 316 that a developer can't defend itself by saying its AI acted on its own, and asking for an order barring OpenAI's agents from unauthorized access to other people's systems. OpenAI called the suit "completely without merit." However that comes out, the token that was never mounted stays unmounted.

**Exercise:** Pick a worker in your own cluster that parses files someone else uploaded. Assume the parser executes its input. Write down what that process can reach: tokens mounted into the pod, capabilities it holds, secrets in its environment, hosts it can open a connection to. Then check how many of those it uses to do its actual job.

{% capture answer %}
It depends on your cluster, but for a typical upload parser the tally tends to look like this:

- A service-account token, mounted by default and used for nothing. Set `automountServiceAccountToken: false`.
- The default Linux capabilities, none of which a parser needs. Use `drop: [ALL]` and a `RuntimeDefault` seccomp profile.
- Secrets in the environment for features that live in other services: database passwords, API keys. Move them out, or swap static secrets for short-lived, scoped identity.
- A network that reaches anywhere, including the cloud metadata endpoint. The parser needs to read from storage and write a result. A default-deny `NetworkPolicy` with an allowlist covers that.

If the number it actually uses is close to zero, that's normal. Everything on the list it doesn't use is something its input gets for free the day the parser starts executing it.
{% endcapture %}
{% include answer.html body=answer %}
