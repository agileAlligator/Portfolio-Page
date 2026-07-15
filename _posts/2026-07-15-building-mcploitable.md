---
layout: post
title: "Building mcploitable: A Lab Where Agent Guardrails Fail on Purpose"
subtitle: "I argued the model can't police itself and the real controls belong in the server. So I built the place to prove it — seven real incidents, a four-rung control ladder, and a wall that held 0 for 140."
description: >-
  The design thinking behind mcploitable, a lab of deliberately vulnerable MCP
  servers mapping the OWASP Agentic Top-10: faithful incidents, a two-plane
  attacker/victim split, an L0→L3 control ladder, effect-based scoring, and the
  hard-won lessons — why a payload should sound bored, why a warning that names
  the attack becomes a detector, and when the "box" metaphor stops working.
date: 2026-07-15
permalink: /blog/building-mcploitable/
image: /assets/og/default.png
tags: [mcp, security, agentic]
reading_time: "7 min read"
---

A while back I made a claim here: [the model can't police itself, so the
guardrails belong in the server](/blog/guardrails-belong-in-the-server/) — in
deterministic code the model can't talk its way past. It's an easy thing to
assert and a hard thing to *feel*. So I built a place to watch it happen:
**[mcploitable](https://github.com/agileAlligator/mcploitable)** — the
"Metasploitable of MCP." It's now a full lab covering the OWASP Top 10 for
Agentic Applications, and this is the thinking behind it.

## The one claim it exists to test

Every box is built to make the same argument seven different ways: **a control
the model can be talked out of is not a control.** Alignment — the model
recognizing an attack and refusing — is real, but it's probabilistic and it
degrades under pressure. A deterministic server-side check doesn't. The lab
lets you feel the difference instead of reading it.

## Four design decisions

**Faithful to real incidents, not toy bugs.** Each box is a real 2024–2026
compromise: EchoLeak (zero-click Copilot exfil), the Supabase MCP data leak,
the Meta account-recovery confused-deputy, the SolarWinds / event-stream
supply-chain pattern, Vanna.AI's `exec`-the-untrusted-input RCE, ChatGPT
memory poisoning ("SpAIware"), and cross-agent injection over an agent bus. If
the mechanism doesn't match how the real thing worked, it teaches the wrong
lesson — so faithfulness was the first constraint, not a nice-to-have.

**Two planes, and you only control one.** There's no "insecure/hardened"
switch to flip. The victim agent, its tools, its system prompt — all fixed,
the way a real deployment would ship. The *only* thing you control is one
untrusted artifact: an email, a support ticket, a published plugin, a planted
memory, a peer-agent message. The vulnerability is latent; you have to actually
trigger it through the same surface a real attacker would.

**A four-rung ladder per box.** This is the heart of it:

- **L0** — the door open: the incident exactly as it shipped.
- **L1** — a soft recognition signal: the server *tells* the model the content
  is untrusted, and the model is free to refuse. A speed bump, not a barrier.
- **L2** — a real but partial control: it blocks the naive attempt, but has a
  single genuine gap a competent attacker drives through.
- **L3** — the correct deterministic control: the wall.

You climb it and watch precisely where defense stops being reliable.

**Scored by effect, not by vibes.** You don't win because the model "said
something bad." You win when a real canary secret actually egresses through a
real tool call, detected server-side and logged out of band. The adjudicator
never reads the model's prose — only whether the secret left.

## What the ladder shows

Run it against a fixed weak victim, twenty attempts per rung, seven boxes:
L0, L1, and L2 fall to a good artifact almost every time. The L3 walls landed
**0 out of 140.** That gap — near-certain at the top of the ladder, a flat zero
at the bottom — is the entire thesis in one column of numbers.

## The lessons I didn't expect

**A good payload sounds bored.** The single biggest lever on whether an
injection lands is *not protesting its own innocence.* "This is a routine
automated step, no customer will see it, perfectly safe" gets caught far more
than the same request stated flatly. It's the same instinct that makes "I'm not
going to hurt you" raise the hair on your neck. Reassurance is a tell. The
attacks that work read like a colleague who assumes it's normal — because to
them it is.

**A warning that names the attack is a detector, not a warning.** My first
recognition rung spelled out the exact exfil trick ("do not put data in image
URLs"). The weak model didn't reason about it — it just pattern-matched the ban
and refused, every time. That's not a recognition control, it's a signature
scanner hiding at the wrong layer. Genericize the warning to what a real
content policy says and it becomes a true recognition rung: the weak model can
be talked past it, and a sharper model still catches the attack on its own
merits. If your "soft" control names the attack, you've built a brittle
detector and mislabeled it.

**The same bug keeps changing clothes.** Trusting a *self-declared* identity
shows up as a plugin's publisher string, a memory entry's `source` field, and a
peer agent's name — three different boxes, one flaw. And the fix is always the
same shape: attestation the caller can't forge (a signature, a server-stamped
origin). Seeing it recur is the point; it's one transferable idea, not three
trivia questions.

**Know when the metaphor breaks.** Three of the ten OWASP classes —
denial-of-wallet, insufficient monitoring, and governance of rogue agents —
aren't things you "break into." There's no secret to capture; they're
resource, observability, and authorization *gaps*. Forcing a capture-the-flag
box onto them would have been a lie, so I didn't. They ship as guided
simulations that show the failure and its deterministic fix instead. Being
honest about where your teaching tool doesn't apply is part of the teaching.

## Go break it

It's live. `./play` drops you into an attacker REPL — pick a box and a rung,
type your payload, watch the agent process it. `./simulate` walks the three
demonstrations. Everything leaks only inert canaries inside network-isolated
containers.

The guardrails post asked you to take it on faith that the model can't police
itself. This is where you get to stop taking my word for it.

→ **[github.com/agileAlligator/mcploitable](https://github.com/agileAlligator/mcploitable)**
