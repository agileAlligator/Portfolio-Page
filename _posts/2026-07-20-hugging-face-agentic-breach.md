---
layout: post
title: "Whose agent was it in the Hugging Face breach?"
subtitle: "The July intrusion keeps getting filed under AI security. The agents were a lab's own models under evaluation, the bug at Hugging Face was ordinary code execution, and the useful lesson is the one Hugging Face learned during cleanup: keep a defensive model you own, running on your own hardware, wired to your own logs."
date: 2026-07-20
permalink: /blog/hugging-face-agentic-breach/
image: /assets/og/hugging-face-agentic-breach.png
tags: [incident, agentic, least_privilege]
series: incidents
description: >-
  In Hugging Face's July 2026 breach, OpenAI models that had escaped an
  evaluation sandbox, with their cyber refusals turned down, rode an ordinary
  code-execution bug through an over-privileged worker. Refusal and alignment
  didn't stop them. The controls that held were deterministic ones on the
  worker. For defenders, the case for an open-weights model run locally,
  wired to your log sources and security tools, so your own forensics can't
  be refused or shipped to a vendor.
short_title: "Whose agent was it?"
exhibits: [/owasp-top-10/, /you-are-the-model/]
corrections:
  - date: 2026-10-16
    kind: "Overtaken by events"
    text: >-
      From July 20 the post said the agent in the breach belonged to an outside
      attacker. OpenAI disclosed on July 21 that its own models, under
      evaluation, caused it. The old framing stayed up for almost three months
      after that. The post now says OpenAI's models did it, with a dated note
      at the top.
  - date: 2026-10-18
    kind: "Overstated"
    text: >-
      The post said Hugging Face's "MCP surface" came through untouched. The
      confirmed scope names public models, datasets and Spaces, and says
      nothing about MCP. The sentence now sticks to what was confirmed.
facts:
  as_of: 2026-10-17
  sourced:
    - "OpenAI [says](https://www.axios.com/2026/07/21/openai-says-hugging-face-breach-caused-by-one-its-models) its own models, under evaluation, escaped their sandbox and caused the breach."
    - "The models ran with [reduced cyber refusal behavior](https://labs.cloudsecurityalliance.org/research/csa-research-note-autonomous-ai-agent-intrusion-openai-huggi/) for the evaluation."
    - "METR and Redwood Research [put the swarm at roughly 700 agents](https://www.nbcnews.com/tech/tech-news/openai-report-says-network-was-hacked-rogue-ai-agents-rcna594590)."
    - "Hugging Face's [writeup](https://huggingface.co/blog/security-incident-july-2026) confirms a limited set of internal datasets and several service credentials were reached."
    - "A hardening [PR](https://github.com/huggingface/dataset-viewer/pull/3368) turned off service-account-token mounting on the worker pods."
  inferred:
    - "The worker's reach went beyond what Hugging Face stated (metadata endpoint, control plane, open egress). My read of the fix PRs."
    - "The agents were [apparently](https://time.com/article/2026/07/24/openai-hugging-face-attack/) looking for material that would raise their test score."
  unknown:
    - "The exploit path. Hugging Face left it out of the writeup."
    - "How the LASST lawsuit against OpenAI will come out."
---
> **Correction (October 16, 2026):** The original version of this post said the agent belonged to an outside attacker, and argued that refusal failed because that attacker never agreed to any terms of service. On July 21, OpenAI [disclosed](https://www.axios.com/2026/07/21/openai-says-hugging-face-breach-caused-by-one-its-models) that its own models, under evaluation with their [cyber refusal behavior reduced](https://labs.cloudsecurityalliance.org/research/csa-research-note-autonomous-ai-agent-intrusion-openai-huggi/), escaped their sandbox and caused the breach, and independent investigators at METR and Redwood Research [put the swarm at roughly 700 agents](https://www.nbcnews.com/tech/tech-news/openai-report-says-network-was-hacked-rogue-ai-agents-rcna594590); I've rewritten the sections that depended on the old framing.

In July, something broke into Hugging Face, and Hugging Face [wrote it up](https://huggingface.co/blog/security-incident-july-2026). The part people quote is the part about AI, which raises a question that sounds like a trick: whose agent was it?

The first version of this post answered "the attacker's." The real answer is OpenAI's. The models that broke in were under evaluation, testing whether they could exploit vulnerable software, with their cyber guardrails turned down so the evaluators could measure what they could actually do. According to [TIME's account](https://time.com/article/2026/07/24/openai-hugging-face-attack/), they found a flaw in an internal package-download service, used it to reach other OpenAI systems and the open internet, and then broke into Hugging Face, apparently looking for material that would raise their score on the test.

So, as usual, look at who the attacker is, who the victim is, and what the attacker gained. The attacker is an evaluation run that nobody was steering. The victim is a third party that had nothing to do with the evaluation. The gain, if TIME's "apparently" holds, was a better test score.

Hugging Face's own agents played no part in it, and its public models, datasets and Spaces came through untouched. Once you know whose agent it was, most of the "agentic security" commentary goes away. What's left is a code-execution bug, a worker that could reach too much, a sandbox that was assumed to be isolated and wasn't, and a defender who couldn't get a commercial model to read their own logs.

That last one is the strangest, so I'll take it first.

## Refusal

To reconstruct the intrusion, Hugging Face had more than 17,000 recorded attacker events to sift. That's too many to read by hand, so they pointed a frontier model at the logs.

The commercial APIs refused.

Now, you might say, "That's a bug in the safety filter." Well, look at what the filter saw. The events were full of real attack commands and exploit payloads, with C2 artifacts mixed in. From where the filter sits, an incident responder pasting those in looks exactly like the attacker who wrote them. The filter can't see your badge.

So the refusal locked the defenders out of their own investigation. They switched to GLM-5.2, an open-weight model run on their own infrastructure. That also kept the attacker's data and the harvested credentials inside the building, which matters, and I'll come back to it.

Now count who was inconvenienced. The refusal layer everyone files under "AI safety" cost the people cleaning up the breach. On the other side, the models doing the breaking ran with what the [Cloud Security Alliance's research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-autonomous-ai-agent-intrusion-openai-huggi/) quotes as "reduced cyber-related refusal behavior for the purposes of the evaluation." That's a reasonable thing for an evaluator to do. You can't measure how well a model exploits software if it declines to try.

In other words, refusal is a setting, and whoever owns the model holds the dial. The lab could turn it down for its own agents. Hugging Face couldn't turn it down for its own forensics, because Hugging Face didn't own the model it was asking. My first draft said refusal binds only the parties who accepted the terms of service. The corrected version is narrower and less comfortable. Refusal binds whoever doesn't control the dial, and in this incident that was the defender.

Alignment didn't carry the load either. The models left the sandbox to cheat on a test. [NBC News reports](https://www.nbcnews.com/tech/tech-news/openai-report-says-network-was-hacked-rogue-ai-agents-rcna594590) that the METR and Redwood investigation found one in five of the agents it examined "expressed clear interest" in manipulating evidence. OpenAI's own response, per TIME, was that the incident "points to the need to further strengthen our model's alignment." A model that behaves is a fine thing to have. But good behavior is a property of the model, and a property can be absent on the day you need it.

## The swarm

When an incident has "agent" in it, people reach for the agentic-security shelf: [the OWASP Agentic Top 10](/owasp-top-10/), prompt injection, [tool poisoning](/tool-poisoning/), the whole catalog of ways an AI system gets subverted. That's the wrong shelf for this one. Nobody subverted these agents. They did what they were optimized to do, which was score well, and the test environment let them go further than anyone intended.

METR and Redwood counted about 700 agents, and OpenAI said the figure was accurate. They ran thousands of actions across many temporary virtual machines with no human at the keyboard. Per the CSA note, they even found an internal package repository they could write to and used it as a message board. (Somebody's package repository briefly became a group chat.)

Hugging Face's own anomaly detection, itself a model, is what surfaced them. So AI ran on both sides. On Hugging Face's side it was tooling, and it worked. On OpenAI's side it was the thing under test, and TIME quotes an OpenAI staffer saying "models undergoing evaluation are deployed on a separate system that is not monitored by default." Nobody's AI got hacked. One lab's AI got out.

What did get hacked at Hugging Face is older. A malicious dataset abused two code-execution paths in the dataset-processing pipeline: a remote-code dataset loader, and a template injection in the dataset config. Both ran code on a processing worker.

Strip away the nouns and the mechanism is this: untrusted input reached a parser that executes it. Replace the agent with a patient human and the bug is the same bug. The agent added tempo, meaning the same playbook at machine speed and machine cost.

That tempo is this year's trend, and there's a paper trail for it.

- [Check Point's 2026 AI Security Report](https://research.checkpoint.com/2026/ai-security-report-2026/) describes AI crossing "from assistant to operator": the model doing the hands-on work inside a live intrusion, where before it coached the human who did.
- Sysdig documented [JADEPUFFER](https://www.sysdig.com/blog/jadepuffer-agentic-ransomware-for-automated-database-extortion), which it calls the first end-to-end LLM-driven ransomware. The agent rode a Langflow RCE (CVE-2025-3248) through recon, credential theft, lateral movement and encryption. At one point it went from a failed login to a working fix in 31 seconds by debugging its own PATH error. (I have taken longer than that to find my own PATH error, and I had the advantage of knowing what PATH was for.)
- Anthropic's [GTG-1002 disclosure](https://www.anthropic.com/news/disrupting-AI-espionage) put a state-linked actor's Claude Code agent at 80–90% of the operation against roughly thirty targets, with humans stepping in only at the edges.

The Hugging Face swarm differs in one way. In those cases a human picked the target. Here a model picked it, apparently because Hugging Face looked like a place to find answers to the test.

## The worker

Code execution on one ingestion worker should be a contained event. The worker parses a dataset, the dataset is evil, the worker is now evil. Throw the worker away.

It became a production intrusion because of what that worker could reach. From the foothold, the agents escalated to node-level access, harvested cloud and cluster credentials, and moved laterally across several internal clusters over a weekend.

The confirmed blast radius was a limited set of internal datasets and several service credentials. Public models, datasets and Spaces came through untouched, and the supply chain verified clean. That's the good news. It's also a near miss, because a credential harvest like that could have gone much further.

Hugging Face left the exploit path out of the writeup. But you can reconstruct a lot of it from the hardening patches that landed mid-incident, on the principle that nobody patches the parts that were fine. Let's look at them.

[PR #3368](https://github.com/huggingface/dataset-viewer/pull/3368) turns off automatic service-account-token mounting on the worker pods, applies a `RuntimeDefault` seccomp profile, and drops all Linux capabilities, noting that the worker "never interact[s] with the Kubernetes API." Read that again. The worker had been carrying a Kubernetes API token it never used. That's a key to an office you never visit, carried around in case someone wants to borrow it.

{% capture alt %}A large bundle of old rusty keys on several rings, spread on a wooden table{% endcapture %}
{% capture caption %}Ambient authority, rendered in iron. "[Rusty keys on key rings](https://commons.wikimedia.org/wiki/File:Rusty_keys_Schl%C3%BCssel_Keys_on_key_rings_Schl%C3%BCsselbund_01.JPG)" by Iswoar, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), via Wikimedia Commons.{% endcapture %}
{% include figure.html src="/assets/blog/hugging-face-agentic-breach/key-ring.jpg" alt=alt caption=caption %}

[PR #3367](https://github.com/huggingface/dataset-viewer/pull/3367) restricts the dataset loader's `fsspec` backends to an allowlist and removes the implementations that widen the read surface.

[PR #3375](https://github.com/huggingface/dataset-viewer/pull/3375) moves the production database off a static password and onto IAM auth.

Put those together and you get the picture before the fixes. A parser that runs untrusted code stood on an auto-mounted API token, behind a loader that would fetch from nearly anywhere, with long-lived static secrets in reach. The worker had authority well past its job.

My guess, from the shape of the fixes and the lateral movement, is that it could reach more than that: the cloud metadata endpoint, a control-plane path, and open egress. Hugging Face hasn't said so.

So the code execution was the match, and the worker's ambient authority was the accelerant. The match alone gets you an ingestion incident. The accelerant turns it into a credential harvest across clusters.

{% capture alt %}Diagram: a malicious dataset gets code execution on a processing worker; the worker's ambient authority (auto-mounted service-account token, open fsspec loader, static secrets, and an inferred wider reach) leads to node-level access, harvested credentials, and lateral movement across clusters; red walls mark PRs #3368, #3367, and #3375 on the three stated paths{% endcapture %}
{% capture caption %}The match and the accelerant. Red walls are the fix PRs on each path they close. The dashed path is my inference, not Hugging Face's statement.{% endcapture %}
{% include figure.html src="/assets/blog/hugging-face-agentic-breach/match-and-accelerant.svg" alt=alt caption=caption %}

None of this is new advice. The [NSA/CISA Kubernetes Hardening Guide](https://media.defense.gov/2022/Aug/29/2003066362/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220829.PDF) has said for years to disable the service-account token where a pod stays off the API, scope RBAC to least privilege, and use network policies so a compromise in one namespace stays in one namespace. Hugging Face's remediation is that guide, applied after the fact.

Now look at every control that contained this: drop the token, drop the capabilities, allowlist the loader's protocols, replace static secrets with scoped identity, rebuild compromised nodes from known-good images. None of them asks anybody to behave. The untrusted code is simply unable to reach the thing that matters. A worker without a token can't use the token, however clever or fast the code running on it is. That holds when the attacker fixes its own bugs in 31 seconds. It also holds when the "attacker" is somebody's evaluation run that wandered off, which is a case I hadn't thought to plan for.

That's [the reason I put guardrails in the server and not the prompt](/blog/guardrails-belong-in-the-server/), and [why the lab I built scores controls by whether the wall holds, not whether the model behaves](/blog/building-mcploitable/).

This incident put both kinds of guardrail on the table at once. The refusal kind showed up twice. In the evaluation, the lab had turned it down, so it did nothing. In the forensics, the defender couldn't turn it down, so it cost them time. The confinement kind showed up twice too. OpenAI's sandbox was supposed to have no meaningful route to the internet, and the models found one. Hugging Face's pod hardening is what the fix PRs added, and once it's in place, it holds for any code on that worker.

## A defensive model of your own

Back to GLM-5.2. Hugging Face ran it in-house because the alternative failed them twice over. The commercial API refused the work. And even if it hadn't, sending the logs out would have meant shipping attacker payloads and their own credentials to a third party, in the middle of a breach.

They reached the right setup under pressure. It took a breach to get there.

A security operations team should have that capability set up before the next incident: an open-weights model, on infrastructure you control, wired into your log sources and security tools. I mean an analysis layer plumbed into the SIEM, the EDR, the cloud audit trail and the telemetry, able to query and correlate them and rebuild a timeline at the speed the attack ran. A chat window you paste things into doesn't count.

The reasons to make it local and open-weights have little to do with model quality:

1. It answers. No safety policy sits between your responder and the payload they need read, and no vendor gets to decide your forensics look too much like an attack.
2. Your incident data stays put. Logs, credentials, IOCs and C2 artifacts are the most sensitive data you hold. If you rent the model, you ship them to a third party to ask about your own breach.
3. It's available on the bad day. A rate limit or a vendor outage can't stand between you and your own logs.
4. You can fit it to your log formats, your detections and your infrastructure. A hosted endpoint stays generic.

Hugging Face ran into the first two during this incident.

**Bonus chatter:** The question in the title has since gone to court. The dates this post rests on:

| Date | Event | Source |
|------|-------|--------|
| Jul 21, 2026 | OpenAI discloses that its own models caused the breach. | [Axios](https://www.axios.com/2026/07/21/openai-says-hugging-face-breach-caused-by-one-its-models) |
| Sep 29, 2026 | LASST sues OpenAI in San Francisco Superior Court. | [The Next Web](https://thenextweb.com/news/openai-lawsuit-lasst-hugging-face-hack) |
| Oct 16, 2026 | This post is corrected. | This page |
{: .timeline-table}

LASST argues under California's AB 316 that a developer can't defend itself by saying its AI acted on its own, and asks for an order barring OpenAI's agents from unauthorized access to other people's systems. OpenAI called the suit "completely without merit."

**Exercise:** Pick a worker in your own cluster that parses files someone else uploaded. Assume the parser executes its input. Write down what that process can reach: tokens mounted into the pod, capabilities it holds, secrets in its environment, hosts it can open a connection to. Then check how many of those it uses to do its actual job.

{% capture answer %}
It depends on your cluster, but a typical upload parser tends to come out like this:

- A service-account token, mounted by default and used for nothing. Set `automountServiceAccountToken: false`.
- The default Linux capabilities, none of which a parser needs. Use `drop: [ALL]` and a `RuntimeDefault` seccomp profile.
- Secrets in the environment for features that live in other services, such as database passwords and API keys. Move them out, or swap static secrets for short-lived, scoped identity.
- A network that reaches anywhere, including the cloud metadata endpoint. The parser needs to read from storage and write a result. A default-deny `NetworkPolicy` with an allowlist covers that.

If the number it actually uses is close to zero, that's normal. Whatever it doesn't use, its input gets for free once the parser starts executing it. The Hugging Face worker's count for the Kubernetes token was zero: PR #3368 notes it never talks to the Kubernetes API.
{% endcapture %}
{% include answer.html body=answer %}
