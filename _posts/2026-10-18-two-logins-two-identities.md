---
layout: post
title: "The user signed in twice. Was it the same user both times?"
subtitle: "An agent that signs the user in to your identity provider and then to a downstream API holds two identities. Only federation makes them one person."
description: >-
  The two-leg auth pattern (your identity provider for who the user is, OAuth
  for the downstream API) only describes one person when the downstream's SSO
  is federated to that identity provider. Without federation the two logins are
  to two unrelated accounts, and the audit log can name the wrong person. How
  to check, and what to build when federation isn't there.
date: 2026-10-18 05:20:00 +0000
permalink: /blog/two-logins-two-identities/
image: /assets/og/two-logins-two-identities.png
tags: [mcp, identity, oauth]
short_title: "Two logins, maybe two people"
exhibits: [/mcp/]
---

Suppose an agent acts on a downstream API for the user. The user signs in to
your identity provider, so you know who they are. Then the agent runs an OAuth
flow against the downstream API, so it has a token to act with. Every action
goes into an audit log under the identity from the first step:
"alice@example.com refunded order 4471."

Is that log line true?

Only if the downstream's single sign-on is federated to your identity provider.
Without federation, the user signed in twice to two unrelated accounts, and the
log can name the wrong person.

Okay, so what does federation do here? The second login doesn't ask the user
anything new. The downstream sends them back to your identity provider, which
already knows it's Alice, and Alice's account at the downstream is the one that
gets the token. Your Conditional Access and MFA policies cover the downstream
too. The identity you verified is the identity that acts.

Now take federation away. The second login is a separate login, and the user
types whatever credentials they like into the downstream's own sign-in page.
Maybe they're Alice's. Maybe Alice is signed in to the downstream in that
browser as the shared support account, or as her personal account, or as Bob,
because Bob was using the laptop yesterday. Both tokens are real. Nothing in
the flow connects them. You verified one person in step one and got a token for
some account in step two.

A token proves that some account authorized the agent to act. It doesn't say
which human was at the keyboard, and it says nothing at all about any other
token. Federation is what links the two.

The reason federation is missing is often mundane. The downstream account is on
a plan that doesn't offer SSO, so there's nothing to federate.

Now, you might say, "So the log is a little loose. Alice was still the one who
signed in." Let's run the usual check. Who is the attacker? Anyone who completes
the downstream login with an account other than Alice's, which includes Bob from
yesterday and doesn't require any malice. Who is the victim? Alice, whose name
is on the refund, and whoever reads the log later. What did the attacker gain?
No new access, since they already held those downstream credentials. They
gained a log that credits their actions to someone else.

The audit log exists to answer one question, usually under pressure: who did
this? This one looks complete and well-formed, and it points at the wrong
person. That's worse than having no log, because people will believe this one.

So don't write "the downstream is federated to your identity provider" in a
design doc until you've seen the SSO configuration on the downstream side.
Check that the customer's plan supports SSO at all, because many plans don't.
Then it's one of these cases.

- **Federation is there.** Keep both legs. You get your access policies on the
  downstream and one verified person across the whole chain.
- **Federation isn't there, and the deployment is single-user or local.** Drop
  your identity-provider leg. Ask the downstream who the token belongs to,
  through its `userinfo` endpoint or equivalent, and record that. The identity
  in the log is then the identity that acted. Don't make the user sign in twice
  to establish a connection you can't establish.
- **Federation isn't there, and you need multi-user accountability.** Then you
  need federation, or you record both identities and stop claiming they're the
  same person: "alice@example.com (signed in), acting as support@vendor
  (downstream token)."

**Exercise:** You check the `userinfo` response from the downstream after the
second login, and its `email` field matches the email your identity provider
returned: both say `alice@example.com`. Doesn't that prove the two logins were
the same person?

{% capture answer %}
No. It proves that two accounts in two separate systems have the same email string.

Without federation, each system decided on its own who `alice@example.com` is. The downstream might let users set their own email, or not verify it. The account might be a shared one that someone registered with Alice's address years ago. Nobody proved to both systems that it was the same person.

Email matching is fine as a hint to show a human ("these look like the same person, confirm?"). It doesn't belong in an audit log as fact. The comparison that holds up is a stable identifier that one system vouches for to the other, which is what federation provides: the downstream account is linked to the identity provider's subject, and the downstream sent the user to your identity provider to sign in.
{% endcapture %}
{% include answer.html body=answer %}
