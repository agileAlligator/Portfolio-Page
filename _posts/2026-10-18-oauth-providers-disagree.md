---
layout: post
title: "Why does the OAuth flow that worked in my demo fail against a real provider?"
subtitle: "OAuth is a family of options, and each provider picks its own subset. PKCE, redirect matching and plan tiers are where the picks differ."
description: >-
  Three OAuth assumptions that pass in a demo and fail in production when an MCP
  server connects to a downstream API: PKCE does not replace a confidential
  client's secret, loopback redirect matching is exact for some providers and
  any-port for others, and endpoints are gated by plan tier. Check each against
  the provider's own reference, not the spec.
date: 2026-10-18 05:10:00 +0000
permalink: /blog/oauth-providers-disagree/
image: /assets/og/oauth-providers-disagree.png
tags: [mcp, oauth]
short_title: "OAuth is a spec; providers pick"
exhibits: [/mcp/]
corrections:
  - date: 2026-10-18
    kind: "Overstated"
    text: >-
      The post said plenty of other providers compare the redirect URI character
      by character and that an unregistered port fails with redirect_uri_mismatch.
      Several large providers accept any loopback port for native clients
      ([GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps),
      [Google desktop clients](https://developers.google.com/identity/protocols/oauth2/native-app)),
      and `redirect_uri_mismatch` is a provider-specific error name, not an RFC 6749 code.
      It now says exact matching depends on the provider and client type, and cites
      [Google's web application client](https://developers.google.com/identity/protocols/oauth2/web-server),
      which requires an exact match and returns `redirect_uri_mismatch`.
---

Suppose someone reports the following. They wrote an MCP server that connects
to a downstream API on the user's behalf. They read the OAuth 2.1 draft, chose
Authorization Code with PKCE, tested against their own developer account, and
everything worked. Then the first customer tried it, and the flow failed. For a
second customer it failed somewhere else.

They followed the spec. So what went wrong?

Well, the spec describes what an authorization server *may* do, and it offers a
lot of options. Every provider picks its own subset. The demo tested the subset
one provider picked for one account. Let's look at three places where the picks
tend to differ.

Start with PKCE. It's the right default, and the 2.1 draft wants it everywhere.
Now, you might say, "The token request carries a `code_verifier`, so it proves
who I am. I don't need the secret." For a public client, like a desktop app
that can't keep a secret, that usually holds.

Aha, but if the provider registered your app as a confidential client, PKCE
goes on top of the client secret. It doesn't replace it. The token endpoint
expects `client_id` and `client_secret`, and a request that brings only a
`code_verifier` gets back `invalid_client`. Some older providers go further and
don't recognize the PKCE parameters at all.

So before your server promises "Authorization Code with PKCE" for a downstream
API, find out which kind of client the provider thinks you are. Then read the
token endpoint's documentation to see whether it accepts a `code_verifier`,
requires one, or ignores it. (Keep PKCE on the leg where your users sign in to
your own identity provider regardless. This is about the downstream leg.)

Okay, next question: does any localhost port count as a match? A desktop MCP
server usually catches the OAuth callback on a loopback address, and it's
convenient to grab whatever port is free and put it in the redirect URI.

Some providers accept that. Microsoft Entra, for example, ignores the port when
it matches a `http://localhost` redirect URI, so an ephemeral port works. Other
providers, or other client types at the same provider, compare the redirect URI
to the registered one exactly. Google does this for a web application client
(its desktop client takes any loopback port), and an unregistered port fails
with `redirect_uri_mismatch`.

For the exact-match providers, don't float the port. Pick a fixed loopback port
and make it configurable. Then register `http://localhost:<port>/callback`
exactly as your server will send it. Which rule your provider uses decides
whether the port is allowed to move, so find out before you write the listener.

The last one starts from a reasonable belief: "The documentation lists the
endpoint, so the account can call it."

Not necessarily. Providers gate features by plan, including AI endpoints, admin
APIs, SSO and SAML configuration. A free developer account often has no admin
console at all and can't configure SSO. Your integration works against your
account and fails against the customer's, because the customer is on a tier
that doesn't include the endpoint you built on. Or it goes the other way. You
tested on a trial that had everything turned on, and the trial ended.

Check the endpoints you depend on against the plan the customer actually has,
and tell them about the limits you find. "This works on the free plan, but the
AI endpoint is rate-capped there, and SSO needs the Business plan" is a much
better sentence to say before deployment than after.

**Postscript:** The spec does have an opinion on the port question. RFC 8252,
the Best Current Practice for OAuth in native apps, says an authorization server
MUST allow any port on a loopback IP redirect URI, because a native app can't
count on a particular port being free. It also recommends the literal
`127.0.0.1` over the name `localhost`, partly because `localhost` is a name that
something else has to resolve, and resolution can be misconfigured. Providers
that require an exact port aren't following that advice, and you have to work
with them anyway.

**Exercise:** Your server uses a fixed callback port, 8765, registered with an
exact-match provider. A user reports that the sign-in page opens, they approve
access, and then the browser shows "connection refused." The provider's logs
show that the authorization succeeded. What happened?

{% capture answer %}
The provider did its part. It redirected the browser to `http://localhost:8765/callback?code=…`, and nobody was listening on 8765 to receive it.

My guess is that the port was taken. Another program, or a second copy of your own server, was already bound to 8765, so your listener failed to start and the code went nowhere. With an exact-match provider you can't just move to another port, because the redirect URI would no longer match the registration.

That's the cost of a fixed port. Check that the listener actually bound before you open the browser. If it didn't, say "port 8765 is in use" rather than leaving the user on a dead page. (There's a second possibility. The redirect went to `localhost`, which resolved to `::1`, while the listener was bound only to `127.0.0.1`. RFC 8252 prefers the literal address partly to avoid that kind of resolution surprise.)
{% endcapture %}
{% include answer.html body=answer %}
