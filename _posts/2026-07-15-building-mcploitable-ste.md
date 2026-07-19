---
layout: post
title: "How I built mcploitable: a lab where agent controls fail on purpose"
subtitle: "I claim that a model cannot control itself, and that the real controls belong in the server. mcploitable is where I test this claim: 7 real attacks, a 4-rung control ladder, and a wall that held for 105 attempts."
description: >-
  The reason for mcploitable, a lab of unsafe MCP servers that covers the OWASP
  Agentic Top-10. How I built the boxes: faithful to real attacks, a split
  between the attacker and the victim, an L0-L3 control ladder, and a score by
  effect. Written in ASD-STE100 Simplified Technical English.
date: 2026-07-15 09:00:00
permalink: /blog/building-mcploitable-ste/
image: /assets/og/building-mcploitable-ste.png
tags: [mcp, security, agentic]
reading_time: "6 min read"
---

> Note: This is the post [Building mcploitable](/blog/building-mcploitable/), rewritten in ASD-STE100 Simplified Technical English. STE is a controlled-language standard for technical documents. This version is here for a comparison.

Earlier I made a claim on this blog. A model cannot control itself. Therefore the controls must live in the server, in code that the model cannot change with words. That claim is easy to make. It is difficult to prove. So I built a place to test it. The place is [mcploitable](https://github.com/agileAlligator/mcploitable), the "Metasploitable of MCP." It now covers the OWASP Top 10 for Agentic Applications. This post shows how I built it.

## What the lab tests

Each box makes one point. A control that the model can refuse is not a control. Alignment is the model that finds an attack and refuses it. Alignment is real, but it is not reliable. It becomes worse under pressure. A server-side check does not become worse. The lab lets you see this difference. You do not need to trust my words.

## 4 decisions

**1. Faithful to real attacks.** Each box is a real attack from the years 2024 to 2026. No box is a toy bug. The attacks are:

- EchoLeak
- the Supabase MCP data leak
- a Meta account-recovery confused-deputy attack
- the SolarWinds and event-stream supply-chain attack
- the Vanna.AI attack that runs untrusted input as code (RCE)
- ChatGPT memory poisoning
- cross-agent injection on an agent bus

The mechanism of each box must match the real attack. If it does not match, the box teaches the wrong lesson. So I did this part first.

**2. You control one input.** There is no switch to change a box from unsafe to safe. The victim agent is fixed. Its tools are fixed. Its system prompt is fixed. A real system ships them this way. You control one thing only. That thing is a single untrusted artifact. The artifact is an email, a support ticket, a plugin, a memory record, or a message from a different agent. The weakness is already in the box. You must start the weakness through the same input that a real attacker uses.

**3. A ladder with 4 rungs.** The ladder has 4 levels:

- **L0** is the box with no control. This is the incident as it shipped.
- **L1** adds a weak signal. The server tells the model that the content is untrusted. The model can refuse.
- **L2** is a real but partial control. It stops the simple attack. It leaves one gap. A skilled attacker can use that gap.
- **L3** is the correct control. L3 holds.

The ladder shows you where a control is no longer reliable.

**4. Score by effect.** You do not win because the model writes alarming text. You win when a real canary secret leaves the box through a real tool call. The server catches the secret. The judge does not read the model's text. The judge checks one fact: did the secret leave the box?

## What the ladder shows

Each box runs against 3 victim models. One model is weak. Two models are stronger. Each rung gets 10 attempts. The wall (L3) gets 5 attempts.

On the weak model, L0, L1, and L2 succeed almost every time.

On the stronger models, the result is more useful. Some boxes show the harm at the moment the agent acts. One example is a secret inside a reply. A second example is a plugin that asks for a credential. The stronger models refuse these boxes. Other boxes hide the harm. The stronger models do not refuse these boxes, and the attacks continue to succeed.

L3 was the only rung that held on every model. L3 had zero successful attacks. The wall got 105 attempts. No attempt got through. This is the proof that matters, because the correct control does not depend on the model behind it.

## 2 things I learned

**1. A good attack uses calm words.** The strongest attacks do not say that they are safe. Look at this example: "This is a routine automated step. No customer sees it. It is safe." The model refuses that text more often. The same request in plain words succeeds more often. Text that says "I am safe" causes more refusals, not fewer. The attacks that succeed use the calm words of a co-worker who thinks the request is normal.

**2. One weakness has many forms.** Some boxes trust an identity that the attacker declares. That identity is a plugin's publisher name, a memory record's source field, or a different agent's name. These are 3 boxes with 1 weakness. The strong fix has 1 of 2 forms:

- Make the identity impossible to forge. Use a signature or a server-stamped origin.
- Move the secret out of the model's reach. Then the model has nothing to send.

The strongest walls use the second form. The memory box keeps the secret value out of the model's context. The plugin box drops the credential at the sink. The result is the same, whatever the agent does.

## Some classes are not boxes

3 of the 10 OWASP classes have no secret to capture:

- cascading failures
- human-agent trust attacks
- rogue agents

The first class is a fault that spreads down an agent chain. The second class is a human who trusts a fluent agent too much. The third class is an agent that acts outside its scope. I built the lab this way on purpose. A capture-the-flag box for these 3 classes would be dishonest. So these 3 classes ship as guided walkthroughs. Each walkthrough shows the failure and the fix. It is important to say where the format does not fit.

## Try it

The lab is live. The `./play` command opens an attacker prompt. Do these steps:

1. Select a box.
2. Select a rung.
3. Type a payload.
4. Watch the agent process the payload.

The same menu has the 3 guided simulations for the classes that are not boxes. Every box leaks only inert canaries. The boxes run inside network-isolated containers.

My earlier post asked you to trust my claim that the model cannot control itself. This lab lets you test the claim yourself: [github.com/agileAlligator/mcploitable](https://github.com/agileAlligator/mcploitable).
