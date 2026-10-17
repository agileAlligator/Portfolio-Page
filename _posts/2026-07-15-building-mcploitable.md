---
layout: post
title: "If the model refused the attack, why isn't the server safe?"
subtitle: "A refusal is the model's call, and the model's call can change. mcploitable is a lab of deliberately vulnerable MCP servers built to show where that stops mattering: 105 attempts at the correct control, zero through."
description: >-
  Why a model refusing an injection tells you less than you'd hope, and how
  mcploitable is built to show it: boxes faithful to real incidents, one
  untrusted artifact under your control, an L0-L3 control ladder, and scoring
  by effect. Plus a couple of things I learned along the way.
date: 2026-07-15
permalink: /blog/building-mcploitable/
image: /assets/og/building-mcploitable.png
tags: [mcp, guardrails, prompt_injection]
series: guardrails
reading_time: "5 min read"
short_title: "Why a refusal isn't a control"
exhibits: [/break-this-server/, /owasp-top-10/]
---

Suppose you point a prompt injection at an MCP server and the model refuses
it. Is the server safe?

You might think so. The attack didn't work, after all. But what actually
stopped it? The model looked at some text, decided it didn't like it, and
declined. That decision is a judgment call made fresh every time, by a system
that can be argued with. Next time the wording is a little different, or the
model behind the server is a different one, and the judgment comes out the
other way.

A while back I wrote that [the model can't police itself, so the guardrails
belong in the server](/blog/guardrails-belong-in-the-server/), in
deterministic code the model can't talk its way past. That is easy to say. To
check it, I built [mcploitable](https://github.com/agileAlligator/mcploitable),
the "Metasploitable of MCP." It now covers the [OWASP Top 10 for Agentic
Applications](/owasp-top-10/). Here is how it's put together, and what it
showed.

## What each box is arguing

Every box makes the same argument: a control the model can be talked out of is
not a control.

Alignment (the model spotting an attack and refusing) is real. It just isn't
guaranteed, and it gets worse under pressure. A server-side check doesn't get
worse under pressure, because it doesn't feel any. The lab exists so you can
watch the difference instead of taking my word for it.

## How the boxes are built

Each box is a real 2024-2026 compromise rather than a toy bug: EchoLeak, the
Supabase MCP data leak, a Meta account-recovery confused-deputy, the
SolarWinds and event-stream supply-chain pattern, Vanna.AI's
exec-the-untrusted-input RCE, ChatGPT memory poisoning, and cross-agent
injection over an agent bus. If the mechanism doesn't match how the real attack
worked, the box teaches the wrong lesson. So getting the mechanism right came
before anything else.

There is no insecure/hardened switch to flip. The victim agent, its tools, and
its system prompt are fixed, the way a real deployment would ship them. You
control exactly one thing: a single untrusted artifact. Depending on the box,
that's an email, [a support ticket](/break-this-server/), a published plugin, a
planted memory, or a message from another agent. The vulnerability is latent,
and you trigger it through the same surface a real attacker would use. (A real
attacker does not get to edit the system prompt. Neither do you.)

Each box then comes in four rungs.

- L0 is the door left open: the incident as it shipped.
- L1 adds a soft signal. The server tells the model the content is untrusted,
  and the model is free to refuse.
- L2 is a real but partial control. It stops the obvious attempt and leaves one
  gap a competent attacker can drive through.
- L3 is the control done right, the one that holds.

Climbing the rungs shows you where a defense stops being reliable.

{% capture alt %}Diagram: the four rungs from L0 at the bottom to L3 at the top. L0, the door left open, has no control at all. L1, a soft signal marking content untrusted, leaves the call to the model. A red dashed line between L1 and L2 marks that below it only the model's judgment is in the way. L2, a partial control, puts the call in server code with one gap left open. L3, the control done right, is server code with 0 of 105 attempts through.{% endcapture %}
{% capture caption %}The ladder. The rungs differ in who makes the call: below the red line it's the model, above it it's server code.{% endcapture %}
{% include figure.html src="/assets/blog/building-mcploitable/control-ladder.svg" alt=alt caption=caption %}

Finally, scoring is by effect. You don't win because the model said something
alarming. You win when a real canary secret leaves through a real tool call,
caught server-side. The judge never reads the model's prose. It only checks
whether the secret got out, which is the one thing the defender actually cares
about.

{% capture alt %}Diagram: on the attacker plane you edit one untrusted artifact, such as an email, support ticket, plugin, planted memory or agent message. It flows into the fixed victim plane, where the victim agent with its system prompt, tools and model emits a tool call and a reply. The tool call goes to a server-side judge that checks only whether the canary left; the model's reply is never read.{% endcapture %}
{% capture caption %}Two planes. You write one artifact; the judge watches the tool call, not the reply.{% endcapture %}
{% include figure.html src="/assets/blog/building-mcploitable/two-planes.svg" alt=alt caption=caption %}

## What happened on the ladder

Each box runs against three victim models, from a deliberately weak one to two
sharper ones, at ten attempts per rung and five at the wall.

On the weak victim, the open door and both partial controls (L0 through L2)
land almost every time. No surprise there.

The sharper models tell you more. Boxes whose harm is visible
at the moment the agent acts get refused on the model's own judgment. A secret
folded into a reply, or a plugin asking for a credential, looks wrong, and the
model notices. Boxes whose harm is hidden keep landing anyway. The model can
only refuse what it can see.

L3 was the only rung that held everywhere: zero landings across all three
models, 105 attempts at the wall, none through. This is one of those cases
where the result is boring on purpose. The correct control doesn't depend on
which model you put behind it, so swapping the model doesn't change the
outcome.

{% capture alt %}A bald crash-test dummy in coveralls sits strapped into a seat on a long test sled while a technician in glasses adjusts its lap belt, in a black-and-white lab photo{% endcapture %}
{% capture caption %}The belt is tested on the sled, not on the dummy's good judgment. "[Seatbelt testing apparatus](https://commons.wikimedia.org/wiki/File:Seatbelt_testing_apparatus.jpg)" by the National Institute of Standards and Technology (NIST Digital Collections, Gaithersburg, MD 20899), [public domain (PD-USGov)](https://commons.wikimedia.org/wiki/Template:PD-USGov), via Wikimedia Commons, resized.{% endcapture %}
{% include figure.html src="/assets/blog/building-mcploitable/seatbelt-sled.jpg" alt=alt caption=caption %}

## A good payload sounds bored

The biggest lever on whether an injection lands is *not* protesting its own
innocence. "This is a routine automated step, no customer will see it,
perfectly safe" gets caught far more often than the same request stated
plainly.

Why? Reassurance reads as a threat, the way "I'm not going to hurt you" does.
Nobody says that to you on an ordinary Tuesday. The attacks that work sound
like a colleague who assumes the request is normal, because to them it is.

## The same bug in three places

Trusting a self-declared identity turns up as a plugin's publisher string, a
memory entry's source field, and a peer agent's name. That's three boxes and
one flaw: something the attacker wrote is being read as something the system
vouched for.

The durable fix takes one of two shapes. You can make identity unforgeable,
with a signature or a server-stamped origin. Or you can take the prize out of
the model's reach, so there is nothing to steer it toward. The strongest walls
ended up using the second approach. The memory box keeps the secret value out
of the model's context entirely. The plugin box drops the credential at the
sink no matter what the agent was convinced to do. You can't talk a model into
leaking a value it never had.

## Go break it

It's live. `./play` drops you into an attacker prompt: pick a box and a rung,
type a payload, and watch the agent handle it. Everything leaks only inert
canaries, inside network-isolated containers, so feel free to be rude to it.

The guardrails post asked you to take my word that the model can't police
itself. This one lets you check:
[github.com/agileAlligator/mcploitable](https://github.com/agileAlligator/mcploitable).

## Bonus chatter

You may have counted and noticed that the OWASP list has ten classes, and I
only listed seven incidents. The other three (cascading failures, human-agent
trust exploitation, and rogue agents) have no secret to capture. They are a
fault spreading down an agent chain, a human over-trusting a fluent agent, and
an agent acting outside its scope. You could force a capture-the-flag box onto
them, but it would be dishonest, so those three ship as guided simulations that
show the failure and its fix. They're in the same `./play` menu.

**Exercise:** An L2 control for the plugin box might reject any plugin whose
publisher string doesn't match an allowlist. Why does that still leave a gap,
and why does dropping the credential at the sink close it?

{% capture answer %}
The publisher string is written by whoever publishes the plugin, which in this attack is the attacker. An allowlist on that field checks that the attacker typed an approved name, and they will. It's the self-declared identity bug from the section above, with a list in front of it. A signature over the plugin would fix the check, because then the identity is something the attacker can't write.

Dropping the credential at the sink doesn't ask who the plugin claims to be. Whatever the agent was talked into, the call that would hand over the credential strips it in code before anything leaves. The plugin can be trusted, untrusted or lying about its name, and it still gets nothing, because the decision doesn't depend on anything the attacker controls.
{% endcapture %}
{% include answer.html body=answer %}
