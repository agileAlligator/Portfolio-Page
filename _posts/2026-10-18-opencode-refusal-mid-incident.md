---
layout: post
title: "Why did OpenCode need a different model halfway through its incident?"
subtitle: "The frontier models helping with the investigation started refusing. The fix was a vetted-access tier from the vendor, which works, but only once someone approves you."
description: >-
  During the October 2026 OpenCode Console breach, the frontier models helping
  the team investigate started refusing partway through. The team got OpenAI's
  Daybreak Blue access and carried on. Vetted access and an open-weight model
  you run yourself both solve the refusal problem; only one of them is ready
  before an incident starts.
date: 2026-10-18 17:00:00 +0000
permalink: /blog/opencode-refusal-mid-incident/
image: /assets/og/opencode-refusal-mid-incident.png
tags: [incident, agentic, guardrails]
series: incidents
short_title: "Refused mid-incident"
facts:
  as_of: 2026-10-18
  sourced:
    - "OpenCode [emailed affected users](https://dev.to/gabrielanhaia/opencode-told-14-of-console-users-to-revoke-their-openai-and-anthropic-keys-561) that it found \"unauthorized access to a legacy system that we were in the process of decommissioning\" and that provider keys saved in Console workspaces \"may have been exposed.\""
    - "OpenCode [said on X](https://x.com/opencode/status/2111519637049319818) the breach was \"related to a large scale distillation attack\", hit 1.4% of Console users, and is ongoing."
    - "Anthropic's Lydia Hallie [said](https://x.com/lydiahallie/status/2111563956666110287) Anthropic has \"revoked Claude API keys we believe were affected.\""
    - "Dax Raad [wrote](https://x.com/thdxr/status/2111790511409258796) that the attacks had run non-stop for 48 hours, and [replied](https://x.com/thdxr/status/2111831348336091179) that frontier models \"did quite a bit and then started refusing\" before the team got Daybreak Blue access."
    - "Dax [said](https://x.com/thdxr/status/2111838044940550257) OpenCode had \"coincidentally applied for it a few days ago\" and was approved \"yesterday\", which is October 17."
    - "OpenAI [says](https://openai.com/index/expanding-daybreak-as-the-cyber-defense-window-narrows/) Daybreak Blue removes the system-level safeguards that screen cybersecurity requests in production, for approved defenders doing work that includes incident response."
  inferred:
    - "That the models that refused included OpenAI's standard ones. Dax didn't name them, but Daybreak Blue only changes OpenAI's models."
    - "That the refusals came before the approval. Dax describes them in that order."
    - "That the stolen keys were used to query models at scale. That's the usual meaning of distillation, and users reported large charges, but OpenCode hasn't said."
  unknown:
    - "How the attackers got into the legacy system. OpenCode hasn't said, and [Cyera](https://www.cyera.com/research/opencode-breach-what-happened-and-how-to-rotate-exposed-ai-api-keys) lists it as unknown."
    - "Which models refused, and what they were asked to do."
---

On October 17, OpenCode emailed about 1.4% of the people who use its Console.
"We identified unauthorized access to a legacy system that we were in the
process of decommissioning," it said, and the OpenAI and Anthropic keys those
users had saved in their workspaces "may have been exposed." The next day,
co-founder Dax Raad wrote that the attackers had been "non stop trying to
attack our systems for the past 48 hours." Someone asked whether the cyber
safeguards on frontier models were getting in the way. He said they were.

{% capture alt %}Screenshot of an X thread. Dax (@thdxr) writes: "they've been non stop trying to attack our systems for the past 48 hours. a side effect is everything is getting hardened but damn we basically need agents going 24/7 because that's what they have." Rhys (@RhysSullivan) replies: "Are you getting blocked by cyber safe guards at all with frontier models?" Dax answers: "yes that was a bit frustrating mid incident when trying to investigate. they did quite a bit and then started refusing. we got access to daybreak blue now so it's better." Dated 18 Oct 26.{% endcapture %}
{% capture caption %}The [post](https://x.com/thdxr/status/2111790511409258796) and the [reply](https://x.com/thdxr/status/2111831348336091179), October 18.{% endcapture %}
{% include figure.html src="/assets/blog/opencode-console-breach/dax-thread.jpg" alt=alt caption=caption %}

So why did the investigation need a different tier of model halfway through?
Because the defender didn't own the setting that mattered. The model's vendor
decides how much security work it will do, and OpenCode's request to change
that setting was still being processed when the attack began.

## What happened

| When (UTC) | What |
|---|---|
| Night of Oct 16 | The breach, which OpenCode later described as happening "last night". |
| Oct 17, morning | OpenCode emails affected Console users to revoke and replace their provider keys. |
| Oct 17 | OpenAI approves OpenCode for Daybreak Blue, a few days after it applied. |
| Oct 17, 18:08 | OpenCode [on X](https://x.com/opencode/status/2111519637049319818): "a large scale distillation attack", 1.4% of Console users, incident ongoing. |
| Oct 17, 18:41 | Dax [posts](https://x.com/thdxr/status/2111528031072461114): "my personal accounts are being attacked now too." |
| Oct 17, 21:04 | Anthropic's Lydia Hallie [says](https://x.com/lydiahallie/status/2111563956666110287) it has revoked the Claude keys it believes were affected. |
| Oct 18, 12:04 | Dax [posts](https://x.com/thdxr/status/2111790511409258796) about 48 hours of non-stop attacks. |
| Oct 18, 14:46 | Dax [replies](https://x.com/thdxr/status/2111831348336091179) that the models started refusing mid-investigation, and that the team now has Daybreak Blue. |
{: .timeline-table}

The breach was in the Console, OpenCode's hosted service, not in the
open-source coding agent. Dax [made that point](https://x.com/thdxr/status/2111572618340188393)
himself: keys you give the local agent "never come to us."

OpenCode hasn't explained "distillation attack," because the incident is
ongoing. The usual meaning is querying a frontier model at scale and training a
cheaper model on the answers. Stolen provider keys suit that well, since
somebody else pays for the queries. Users have
[reported charges](https://dealroom.co/news/163473-opencode-breach-drains-users-ai-keys-as-platforms-holding-customer-crede/)
from a few hundred dollars to $1,700. That reading of the attack is mine and
the press's, not OpenCode's.

Who is the attacker? Unknown. Who is the victim? The Console users, who pay for
the tokens, and the model vendors, whose outputs are being harvested. What did
the attacker gain? Frontier model output on someone else's bill. OpenCode was
just where the keys were kept.

## The refusals

You might say the models were being sensible. A stranger asking how an
attacker got into a system, and what the attacker did next, looks a lot like an
attacker asking the same thing. AWS's write-up of Daybreak puts it this way:
cybersecurity is "inherently dual use," and "general-purpose models resolve
that ambiguity by declining the request." An investigation is about as
dual-use as security work gets. You read the attacker's tooling and replay
their steps to see whether they still work.

OpenAI's [own explanation](https://openai.com/index/expanding-daybreak-as-the-cyber-defense-window-narrows/)
fits "did quite a bit and then started refusing." In production, it says, "we
deploy system-level safeguards to screen cybersecurity-related requests to
prevent misuse, but they can also block legitimate defensive work." A screen
like that judges each request as it arrives, so an investigation can go fine
until it reaches the part that looks like an attack. My guess is that's what
happened here, though dax didn't say which model refused or what it was asked.

Daybreak settles the ambiguity with identity instead. "Daybreak Blue access
removes those guardrails," OpenAI says, "helping defenders get more out of the
model in real-world security tasks, including incident detection and response,
investigations, vulnerability management, and security assessments." In
exchange, OpenAI controls access "through identity verification, account
security, monitoring, approved-use restrictions, and legal attestations," and
it has required hardware security keys on individual Daybreak accounts since
September 1.

Blue doesn't loosen everything. OpenAI says that even without the screens,
GPT-5.6 Sol still refuses "highly dual-use" prompts such as pentesting
production systems. On its internal Advanced Cybersecurity Completion Rate
eval, which asks for exploit chains, authentication bypasses and privilege
escalation, GPT-5.6 Sol completes 1.5% of requests and Blue completes 2.0%.
GPT-5.6-Cyber, on the separately approved Red tier, completes 95.0%. So Blue
loosens the defensive work and leaves the offensive refusals roughly where they
were. For an investigation, that's the right shape.

This is the same dial as in the [Hugging Face breach](/blog/hugging-face-agentic-breach/),
with a different hand on it. There, OpenAI's own models ran with their cyber
refusals turned down for an evaluation, and Hugging Face, unable to get
commercial APIs to read its own logs, switched to an open-weight model on its
own hardware. OpenCode asked the vendor to turn the dial for it, and the vendor
did.

Both approaches work. The difference is when they're available. An open-weight
model is yours as soon as it's downloaded. Vetted access is yours once someone
approves it. OpenCode, as it happens, had applied before anyone attacked it.
Dax [says](https://x.com/thdxr/status/2111838044940550257) they "coincidentally
applied for it a few days ago and it got approved yesterday." That's a few days
from application to approval, and the approval still landed the day after the
breach, with refusals in between. OpenAI doesn't publish approval times, and
its [documentation](https://developers.openai.com/codex/cyber-safety) warns
that "submitting an application or completing identity verification doesn't
guarantee approval."

So treat model access like any other incident-response dependency, and arrange
it well before you need it. A few days early was almost early enough. Apply for
your vendor's vetted tier while nothing is on fire, keep an open-weight model
ready on hardware you control, or do both.
OpenAI takes applications from
[individuals](https://chatgpt.com/cyber) and
[organizations](https://openai.com/form/enterprise-trusted-access-for-cyber/).
On [Amazon Bedrock](https://aws.amazon.com/blogs/machine-learning/accelerate-cyber-defense-with-openai-and-aws-daybreak-red-daybreak-blue-now-available-to-eligible-customers-on-amazon-bedrock/),
there's a second step through your AWS account team. OpenAI's
[$1 billion subsidy](https://openai.com/index/daybreak-for-frontline-defenders/)
for Daybreak access names open-source maintainers among the groups it
prioritises, which would cover a team like OpenCode's.

**Postscript:** OpenCode isn't the first platform this month to lose customers'
secrets. Fireworks AI's [bulletin](https://fireworks.ai/security/bulletins/october-2026-security-incident)
says that someone using internal Fireworks credentials reached the environment
variables of some customers' evaluation jobs, and captured the API keys and
tokens stored there as secrets. Fireworks spotted it on October 6 and told
customers on October 9.

**Exercise:** A Console user reads the email, opens their workspace and deletes
the saved Anthropic key. A day later, their Anthropic usage is still climbing.
What did they miss?

{% capture answer %}
Deleting the key in the Console removed OpenCode's copy. The attacker has their own copy, and a key stays valid at the provider until it's revoked there.

The fix is in the Anthropic console: revoke the old key, create a new one, put the new one wherever it's needed, and check usage for the period the old key was exposed. Anthropic revoked the keys it *believed* were affected, so an affected key it missed is still live until the owner revokes it.
{% endcapture %}
{% include answer.html body=answer %}
