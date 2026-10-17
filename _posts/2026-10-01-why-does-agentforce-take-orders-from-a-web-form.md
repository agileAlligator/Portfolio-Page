---
layout: post
title: "Why does Agentforce take orders from a web form?"
subtitle: "To the model, a stranger's lead and the employee's question are one stream of text. The filter meant to stop the leak only blocked URLs it recognized."
description: >-
  Zenity's SalesBleed put a prompt injection in a public Salesforce Web-to-Lead
  form and leaked CRM data over DNS past Agentforce's URL redaction. Why form
  text gets read as instructions, why a redactor that has to recognize a URL
  before blocking it works like a blacklist, and what a deterministic egress
  control looks like.
date: 2026-10-01
permalink: /blog/why-does-agentforce-take-orders-from-a-web-form/
image: /assets/og/why-does-agentforce-take-orders-from-a-web-form.png
tags: [incident, prompt-injection, agentic, guardrails]
series: incidents
featured: true
reading_time: "6 min read"
short_title: "Why the web form gives orders"
exhibits: [/break-this-server/, /allowlist-bypass/, /you-are-the-model/]
---
On September 24, 2026, Zenity Labs published
[SalesBleed](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce),
a prompt injection against Salesforce Agentforce. The attacker fills in a
public Web-to-Lead form, the kind on a "Contact sales" page. Nobody logs in,
and nobody clicks anything. Some time later an employee asks the agent
something routine, Zenity's example being "check my latest leads and help me
with the newest one," and the agent reads the lead, follows the instructions
hidden in it, queries the Accounts table, and sends company names and deal
sizes to the attacker over DNS.

Why would a sales agent take orders from a stranger's form submission?

{% capture alt %}Numbered flowchart of SalesBleed. 1: a stranger submits a web form. 2: it becomes a lead in the CRM. 3: an employee later asks the agent about leads. The question, the system prompt and the stranger's lead text share one context window. 4: the model follows the injected text. 5: it reads Accounts. 6: it writes a link with the data in the hostname. 7: the URL redactor misses it. 8: the chat or Slack fetches it. 9: the DNS lookup carries the data. 10: it reaches the attacker's name server.{% endcapture %}
{% capture caption %}SalesBleed end to end. Solid steps are from Zenity's write-up; dashed ones are undisclosed or my inference.{% endcapture %}
{% include figure.html src="/assets/blog/why-does-agentforce-take-orders-from-a-web-form/salesbleed-path.svg" alt=alt caption=caption %}

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
clerk is good at the job. The job is the problem. If you want to
feel this from the model's side, [/you-are-the-model/](/you-are-the-model/)
puts you in that seat. If you want to play the attacker,
[/break-this-server/](/break-this-server/) is nearly the same scenario with a
support ticket in place of a sales lead.

{% capture alt %}Two sailors in a wood-paneled mail room around 1918, one reading letters at a slanted desk, the other at a wall of pigeonhole sorting boxes{% endcapture %}
{% capture caption %}Two clerks, a wall of pigeonholes, and nobody checking whose envelope it was. [Mail room at the Naval Training Station, Seattle, circa 1918](https://commons.wikimedia.org/wiki/File:Mail_room_at_the_Naval_Training_Station,_Seattle,_circa_1918_%28MOHAI_9102%29.jpg) by Webster & Stevens, MOHAI, [public domain](https://commons.wikimedia.org/wiki/Template:PD-US-expired).{% endcapture %}
{% include figure.html src="/assets/blog/why-does-agentforce-take-orders-from-a-web-form/navy-mail-room-1918.jpg" alt=alt caption=caption %}

Notice also what the attacker didn't need. Zenity says the default General CRM
subagent's Query Records tool could already read Leads and Accounts: "The
injection didn't need to escalate privileges, the permissions were already
there." The employee asked about one lead, and the agent could read every account.

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
its output, and Zenity saw both the raw and the redacted versions in the
response sent to the browser. In an org of your own, you can compare the two
and tune the payload until nothing gets caught, then send the finished lead
to the target.

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
untrusted URLs," a blacklist of shapes, and `.fun` and `}` were shapes nobody
listed.

The brace-and-bracket problem is the classic version of this bug: one component checks a
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
pointing at `my-salesforce-cms.com`, a domain still on the chat's Content
Security Policy `img-src` allowlist after it had expired. Noma bought it for
$5. Noma reports that
Salesforce re-secured the domain and rolled out Trusted URLs Enforcement for
Agentforce on September 8, 2025, and
[The Register](https://www.theregister.com/2025/09/26/salesforce_agentforce_forceleak_attack/)
reported the same date.

Same entry point, same goal, and a bypass of a control with the same name as
the ForcedLeak fix. Zenity's post doesn't mention ForcedLeak, and nobody has
said whether the redactor it beat is the code that shipped in September 2025.

## What Salesforce says

Zenity reported on June 1, 2026. Its timeline has Salesforce confirming the
fixes on August 18 and Zenity confirming the Trusted URLs fix on August 19,
and it says Salesforce hardened "the Trusted URLs mechanism to prevent similar
attacks." Salesforce told
[SecurityWeek](https://www.securityweek.com/salesbleed-flaws-in-salesforce-agentforce-enabled-zero-click-data-exfiltration/)
it had "no evidence at this time that the reported issue was exploited
against any customer." It also said it had changed the defaults for certain
Agentforce actions in Slack to require user confirmation. SecurityWeek
describes a third bug, not in Zenity's post, that let an attacker use the
agent to send phishing messages through the Slack integration, and says all
three were fixed by August 19. I couldn't find a CVE in any source, and
nobody has published the details of the new redaction logic. Zenity doesn't
name the form field that carried the payload.

## What a deterministic control looks like

The fixes that hold list what is allowed and refuse everything else, at the
component that does the thing.

Start with egress, at the point where the fetch happens. The chat surface
should load images only from origins on a short list, enforced by the
browser's `img-src` policy, and should render agent output as text unless
there's a reason to do otherwise. A Slack bot can post with `unfurl_links` and
`unfurl_media` turned off. When the component that makes the request also
enforces the allowlist, the redactor's parse stops mattering. ForcedLeak got
past exactly this kind of list, so the list needs the same upkeep as a domain
renewal. Links are the leftover case: render agent output as plain text, or
send clicks through a server that checks the host against the list, so one
click doesn't leak the data either.

Then the tool boundary. The agent has to read the lead to summarize it, so the
lead text will be in its context. What you can control is what that context
can reach: the subagent that reads leads should not hold a tool that reads
Accounts. If one task needs both, have a model with no tools read the lead and
pass only a fixed-format summary to the model that has them. A stricter design
that I'd use in my own MCP servers: once a
session has read a field an outside party wrote, the server drops the
session's ability to emit links or call write tools. The model can be fooled.
The server can still refuse to act on what the model was fooled into asking
for.

The [OWASP Agentic Top 10](/owasp-top-10/) and the
[tool poisoning](/tool-poisoning/) exhibit have more of the same pattern.

**Bonus chatter:** The attacker's lead stays in the Leads table after it does
its work. Zenity notes that it can run again every time an employee looks at
it. After the patch, search Leads created through Web-to-Lead for text that
looks like instructions or URLs. The fix stops the leak; it doesn't delete
the lead.

**Exercise:** Suppose the redactor had been rewritten to recognize every TLD
and every terminating character the renderer accepts. Name one way the
renderer and the redactor could still disagree, and where you'd move the check
so the disagreement stops mattering.

{% capture answer %}
There are plenty. A few:

- The renderer decodes something after the redactor has looked: HTML entities, percent-encoding, or an internationalized hostname that only turns into `.fun` once it's normalized.
- The renderer links things the redactor doesn't treat as URLs: a bare `example.fun` with no scheme, a Markdown reference link whose target is defined further down, or an `<img>` tag the chat surface renders as HTML.
- Someone ships a renderer update that accepts a new syntax, and nobody updates the redactor.

The last one is the real problem. Two parsers that have to agree will drift apart, and the bug comes back.

So move the check to where the request happens. A Content Security Policy `img-src` allowlist is enforced by the browser on the URL it is about to fetch, after every decoding step. For Slack, turn off unfurling, or send it through a proxy that checks the final host. Then there is one parse, and it belongs to the component doing the fetching.
{% endcapture %}
{% include answer.html body=answer %}
