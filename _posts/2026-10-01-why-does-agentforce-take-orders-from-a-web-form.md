---
layout: post
title: "Why does Agentforce take orders from a web form?"
subtitle: "Because the lead's text and the user's question arrive in the same token stream, and the filter meant to catch the exfiltration link only blocked URLs it could recognize. SalesBleed, walked through one step at a time."
description: >-
  Zenity's SalesBleed put a prompt injection in a public Salesforce Web-to-Lead
  form and leaked CRM data over DNS past Agentforce's URL redaction. Why form
  text gets read as instructions, why a redactor that has to recognize a URL
  before blocking it works like a blacklist, and what a deterministic egress
  control looks like.
date: 2026-10-01
permalink: /blog/why-does-agentforce-take-orders-from-a-web-form/
image: /assets/og/why-does-agentforce-take-orders-from-a-web-form.png
tags: [incident, prompt-injection, agentic, security]
reading_time: "6 min read"
short_title: "Why the web form gives orders"
exhibits: [/break-this-server/, /allowlist-bypass/, /you-are-the-model/]
---
On September 24, Zenity Labs published
[SalesBleed](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce),
a prompt injection against Salesforce Agentforce. The attacker fills in a
public Web-to-Lead form, the kind on a "Contact sales" page. Nobody logs in,
and nobody clicks anything. Some time later an employee asks the agent
something routine, Zenity's example being "check my latest leads and help me
with the newest one," and the agent reads the lead, follows the instructions
hidden in it, queries the Accounts table, and sends company names and deal
sizes to the attacker over DNS.

Why would a sales agent take orders from a stranger's form submission? Let's
look at what the system is actually doing.

![Diagram of the SalesBleed path. A stranger submits a public Web-to-Lead form, which becomes a lead record; which field carried the payload is not disclosed. Later an employee asks the agent about leads. The vendor system prompt, the employee's question and the Query Records result with the lead fields all enter the agent's context window as one token stream. The model follows the injected text, Query Records reads Accounts, and the agent writes a link with company names and deal sizes in the hostname. The URL redactor misses the .fun TLD and skips curly braces and square brackets that the renderer still links. The chat surface loads it as an image, or Slack's preview fetches it, and the DNS lookup carries the data to the attacker's name server. A dashed box notes that whether this redactor is the ForcedLeak fix is inferred, not disclosed.](/assets/blog/why-does-agentforce-take-orders-from-a-web-form/salesbleed-path.svg)
*SalesBleed end to end. Solid steps are from Zenity's write-up; dashed ones are undisclosed or my inference.*

## The model sees one stream of text

The agent gets a context window. The vendor's system prompt goes in, then the
employee's question, then the result of the Query Records tool, which includes
the lead's fields as the stranger typed them. The model then predicts the next
tokens.

You might think the model knows which part came from the employee and which
part came from the form. It doesn't, in any way that a security property can
rest on. Role markers and delimiters are more tokens in the same sequence. The
model learned from training that text sounding like an instruction is
usually followed by text that carries the instruction out, and the lead
description sounds like an instruction because the attacker wrote it to.

Imagine a mailroom clerk who does whatever any sheet of paper in the inbox
says, including the sheets inside envelopes addressed to other people. The
clerk is cooperative and well trained, and that is the problem. If you want to
feel this from the model's side, [/you-are-the-model/](/you-are-the-model/)
puts you in that seat. If you want to play the attacker,
[/break-this-server/](/break-this-server/) is nearly the same scenario with a
support ticket in place of a sales lead.

![Two sailors in a wood-paneled mail room around 1918, one reading letters at a slanted desk, the other at a wall of pigeonhole sorting boxes](/assets/blog/why-does-agentforce-take-orders-from-a-web-form/navy-mail-room-1918.jpg)
*Every sheet gets read. [Mail room at the Naval Training Station, Seattle, circa 1918](https://commons.wikimedia.org/wiki/File:Mail_room_at_the_Naval_Training_Station,_Seattle,_circa_1918_%28MOHAI_9102%29.jpg) by Webster & Stevens, MOHAI, [public domain](https://commons.wikimedia.org/wiki/Template:PD-US-expired).*

Notice also what the attacker didn't need. Zenity says the default General CRM
subagent's Query Records tool could already read Leads and Accounts: "The
injection didn't need to escalate privileges, the permissions were already
there." The employee asked about a lead, and the agent was holding a key to
the whole account book.

## The filter had to recognize a URL before it could block one

Salesforce had a control for exactly this exfiltration step. Agentforce
redacts URLs in agent output unless they are on a Trusted URLs list. A string
like `https://attacker.example/?d=AcmeCorp` should come out redacted, and the
data stays home.

So how did the data leave? Zenity found that the redactor "only recognized a
fixed set of top level domains as valid hosts," and `.fun` was not among
them. It also found that curly braces and square brackets weren't redacted,
yet the chat surface still treated them as part of a clickable URL. In
Zenity's words, "the redactor and the surface rendering the response didn't
agree on where a valid URL ends." The redaction ran after the agent produced
its output, so the attacker could adjust the payload until the parts that got
caught stopped being caught.

The chat surface then loaded the result as an image, with no click. For agents
published to Slack, Slack's link preview fetched it. Either way, something
resolved a hostname like `Acme-712412.<attacker-subdomain>.oast.fun`, and the
data was in the hostname. Zenity's point is that "the HTTP request that
follows is essentially irrelevant." The DNS query has already carried the
payload to the attacker's name server, so an HTTP egress block arrives too
late.

The Trusted URLs list is an allowlist, but the redactor applies it only to
strings it first recognizes as URLs. Anything the recognizer misses goes
through by default. In practice the rule was "block things that look like
untrusted URLs," and that is a blacklist of shapes. A blacklist of shapes
loses to the first shape its author didn't think of. A TLD missing from a
list and a bracket the two parsers disagree on are both that.

The second half is the classic version of this bug: one component checks a
string under one interpretation, and a different component acts on it under
another. The [wildcard that spans a slash](/allowlist-bypass/) is the same
mistake in a path allowlist, where the glob and the HTTP router disagree about
what `*` covers. I wrote up the fix for that one in
[guardrails belong in the server](/blog/guardrails-belong-in-the-server/). If
the check and the action don't run on the same parse, the attacker gets to
pick the parse.

## Wasn't this fixed last year?

In September 2025, Noma Security disclosed
[ForcedLeak](https://noma.security/blog/forcedleak-agent-risks-exposed-in-salesforce-agentforce/):
a Web-to-Lead Description field carrying an injection, and an image tag
pointing at `my-salesforce-cms.com`, a domain still on Salesforce's
allowlist after it had expired and become available to buy. Noma reports that
Salesforce re-secured the domain and rolled out Trusted URLs Enforcement for
Agentforce on September 8, 2025, and
[The Register](https://www.theregister.com/2025/09/26/salesforce_agentforce_forceleak_attack/)
reported the same date.

What can be verified is this: the same entry point, the same goal, and a
bypass of the control that both Noma and The Register describe as the
ForcedLeak fix. Zenity's post doesn't mention ForcedLeak, and none of the sources I found say
whether the redactor Zenity beat is the same code that shipped in
2025. Calling SalesBleed "a bypass of the ForcedLeak fix" is my inference from
the public timeline. Treat it as that.

## What Salesforce says

Zenity reported on June 1, 2026. Its timeline has Salesforce confirming the
fixes on August 18 and Zenity confirming the Trusted URLs fix on August 19,
and it says Salesforce hardened "the Trusted URLs mechanism to prevent similar
attacks." Salesforce told
[SecurityWeek](https://www.securityweek.com/salesbleed-flaws-in-salesforce-agentforce-enabled-zero-click-data-exfiltration/)
it had "no evidence at this time that the reported issue was exploited
against any customer." It also said it had changed the defaults for certain
Agentforce actions in Slack to require user confirmation, which addresses a
third SalesBleed bug in which the agent posted phishing messages to Slack
under its own trusted identity. I couldn't find a CVE in any source, and
nobody has published the details of the new redaction logic. Zenity doesn't
name the form field that carried the payload.

## What a deterministic control looks like

The fixes that hold don't depend on recognizing bad text. They decide what is
allowed and refuse everything else, at the component that does the thing.

Start with egress, at the point where the fetch happens. The chat surface
should load images only from origins on a short list, enforced by the
browser's `img-src` policy, and should render agent output as text unless
there's a reason to do otherwise. A Slack bot can post with `unfurl_links` and
`unfurl_media` turned off. When the component that makes the request also
enforces the allowlist, the redactor's parse stops mattering. (ForcedLeak
adds one footnote: an allowlist needs the same upkeep as a domain renewal.)

Then the tool boundary. Query Records should return lead fields as typed data
that never goes into the instructions, and the subagent that summarizes leads
should not hold a tool that reads Accounts. A stricter design that I'd use in
my own MCP servers (my design, not anything Salesforce has described): once a
session has read a field an outside party wrote, the server drops the
session's ability to emit links or call write tools. The model can be fooled.
The server can still refuse to act on what the model was fooled into asking
for.

None of this tries to make the model better at spotting injections. That
approach ends in a filter with a fixed list of shapes, and SalesBleed shows
how that turns out. The [OWASP Agentic Top 10](/owasp-top-10/) and the
[tool poisoning](/tool-poisoning/) exhibit have more of the same pattern.

**Bonus chatter:** The attacker's lead stays in the Leads table after it does
its work. Zenity notes that it can run again every time an employee looks at
it. Your cleanup step after a fix like this is a search of your inbound
records.

**Exercise:** Suppose the redactor had been rewritten to recognize every TLD
and every terminating character the renderer accepts. Name one way the
renderer and the redactor could still disagree, and where you'd move the check
so the disagreement stops mattering.
