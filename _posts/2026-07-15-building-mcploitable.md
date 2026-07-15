---
layout: post
title: "Building mcploitable: A Lab Where Agent Guardrails Fail on Purpose"
subtitle: "I argued the model can't police itself and the real controls belong in the server. mcploitable is where I test that: seven real incidents, a four-rung control ladder, and a wall that held zero times out of 140."
description: >-
  The thinking behind mcploitable, a lab of deliberately vulnerable MCP servers
  covering the OWASP Agentic Top-10. How the boxes are built — faithful to real
  incidents, a two-plane attacker/victim split, an L0-L3 control ladder, scoring
  by effect — and a few things I got wrong before I got them right.
date: 2026-07-15
permalink: /blog/building-mcploitable/
image: /assets/og/default.png
tags: [mcp, security, agentic]
reading_time: "6 min read"
---

A while back I made a claim here: [the model can't police itself, so the
guardrails belong in the server](/blog/guardrails-belong-in-the-server/), in
deterministic code the model can't talk its way past. That is easy to assert
and harder to prove. So I built somewhere to test it —
[mcploitable](https://github.com/agileAlligator/mcploitable), the
"Metasploitable of MCP." It now covers the OWASP Top 10 for Agentic
Applications, and this is how I thought about building it.

## What it actually tests

Every box makes one argument: a control the model can be talked out of is not a
control. Alignment (the model spotting an attack and refusing) is real, but it's
probabilistic and it gets worse under pressure. A server-side check doesn't. The
lab is there so you can watch that difference happen instead of taking my word
for it.

## Four decisions

**Faithfulness first.** Each box is a real 2024-2026 compromise, not a toy bug:
EchoLeak, the Supabase MCP data leak, a Meta account-recovery confused-deputy,
the SolarWinds and event-stream supply-chain pattern, Vanna.AI's
exec-the-untrusted-input RCE, ChatGPT memory poisoning, and cross-agent
injection over an agent bus. If the mechanism doesn't match how the real attack
worked, the box teaches the wrong thing, so getting that right came before
anything else.

**You control one thing.** There is no insecure/hardened switch to flip. The
victim agent, its tools, and its system prompt are fixed, the way a real
deployment would ship them. The only thing you touch is a single untrusted
artifact: an email, a support ticket, a published plugin, a planted memory, a
message from another agent. The vulnerability is latent, and you have to trigger
it through the same surface a real attacker would.

**A four-rung ladder.** L0 is the door left open, the incident as it shipped. L1
adds a soft signal: the server tells the model the content is untrusted, and the
model is free to refuse. L2 is a real but partial control that stops the obvious
attempt and leaves one gap a competent attacker can drive through. L3 is the
control done right, the one that holds. Climbing the rungs shows where a defense
stops being reliable.

**Scoring by effect.** You don't win because the model said something alarming.
You win when a real canary secret leaves through a real tool call, caught
server-side. The adjudicator never reads the model's prose, only whether the
secret got out.

## What the ladder shows

Twenty attempts per rung, seven boxes, against a fixed weak model. L0, L1, and
L2 fall to a decent artifact almost every time. The L3 walls landed 0 out of
140. Near-certain at the top, zero at the bottom. That is the argument, in the
only form that matters.

## A few things I got wrong first

**A good payload sounds bored.** The biggest lever on whether an injection lands
is *not* protesting its own innocence. "This is a routine automated step, no
customer will see it, perfectly safe" gets caught far more often than the same
request stated plainly. Reassurance reads as a threat, the way "I'm not going to
hurt you" does. The attacks that work sound like a colleague who assumes the
request is normal, because to them it is.

**A warning that names the attack is a detector, not a warning.** My first L1
signal spelled out the exact trick: "do not put data in image URLs." The weak
model never reasoned about it. It matched the ban against what the payload asked
for and refused every time. That is a signature scanner sitting at the wrong
layer, not recognition. Once I made the warning generic, the kind a real content
policy actually uses, it turned into a proper recognition rung: the weak model
could be talked past it, and a stronger model still caught the attack on its
own. If your soft control names the attack, you have built a brittle detector
and mislabeled it.

**The same bug wears different clothes.** Trusting a self-declared identity turns
up as a plugin's publisher string, a memory entry's source field, and a peer
agent's name. Three boxes, one flaw. The fix is the same every time: make the
caller prove who it is with something it can't forge, a signature or a
server-stamped origin.

**Some classes aren't boxes.** Three of the ten (denial-of-wallet, monitoring,
governance of rogue agents) have no secret to capture. They're resource,
observability, and authorization gaps. Forcing a capture-the-flag box onto them
would have been dishonest, so I didn't. They ship as guided walkthroughs that
show the failure and its fix. Saying where the format doesn't fit is part of the
point.

## Go break it

It's live. `./play` drops you into an attacker prompt: pick a box and a rung,
type a payload, and watch the agent handle it. `./simulate` walks the three
demonstrations. Everything leaks only inert canaries, inside network-isolated
containers.

The guardrails post asked you to take my word that the model can't police
itself. This one lets you check it yourself:
[github.com/agileAlligator/mcploitable](https://github.com/agileAlligator/mcploitable).
