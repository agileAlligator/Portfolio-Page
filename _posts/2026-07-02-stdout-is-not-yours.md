---
layout: post
title: "Why does my MCP server run fine in a terminal but refuse to connect?"
subtitle: "The client parses everything on your stdout as JSON-RPC. Your log lines are not JSON-RPC."
description: >-
  A stdio MCP server that starts cleanly in a terminal but fails under the
  client is almost always writing logs to stdout. Stdout carries the JSON-RPC
  messages, so a log line there breaks the protocol and the client reports it
  as a malformed message. The fix is to send structlog output to stderr.
date: 2026-07-02 14:00:00 +0000
permalink: /blog/stdout-is-not-yours/
image: /assets/og/stdout-is-not-yours.png
tags: [mcp, debugging]
featured: true
short_title: "Stdout belongs to the protocol"
exhibits: [/mcp/]
corrections:
  - date: 2026-10-18
    kind: "Wrong detail"
    text: >-
      The quoted client error listed "warning" among the unrecognized keys. With
      the structlog configuration shown in the post, "warning" is the value of
      the level field, not a key, and parsing such a line with the MCP
      TypeScript SDK (1.32.1) reports only "event", "level" and "timestamp".
      The excerpt now shows those three keys.
  - date: 2026-10-18
    kind: "Overstated"
    text: >-
      The post said a single log line corrupts the conversation and that the
      client rejects the exchange. The reference TypeScript SDK reports a
      malformed stdout line as an error and skips it, so the real reply can
      still arrive; how a given client reacts beyond that varies. The post now
      says the line is rejected and cites the SDK source and the spec's MUST NOT.
  - date: 2026-10-18
    kind: "Overtaken by events"
    text: >-
      The smoke test sent an initialize request followed by tools/list. That
      skipped the notifications/initialized notification the 2025-11-25
      lifecycle requires, and the 2026-07-28 revision removed the initialize
      handshake entirely in favour of per-request metadata and an optional
      server/discover call. The paragraph now describes both.
  - date: 2026-10-18
    kind: "Wrong detail"
    text: >-
      The postscript said a Windows cp1252 console would choke on non-ASCII log
      output. Since Python 3.6 the Windows console uses UTF-8, and sys.stderr
      always uses the backslashreplace error handler, so Python does not crash.
      The real issue was a piped stderr in the ANSI code page sending bytes that
      are not valid UTF-8, which Python 3.15's default UTF-8 mode removes. The
      postscript now says so.
---

Suppose someone reports the following. They built an MCP server. They run
`uv run my-mcp` in a terminal, and it prints its startup banner. No traceback,
exit code 0. Then they point Claude Desktop at it, and the client produces a wall
of schema errors and marks the server as failed.

Nothing crashed. So why won't it connect?

The short version is that the client is reading stdout, and so is your logger.

A stdio MCP server talks to its client over two pipes. It reads JSON-RPC
messages from stdin, and it writes its own to stdout. That is the whole transport. The client
sits on the other end of stdout and parses every line that comes out as a
JSON-RPC message.

You might think of stdout as the place where a program prints things for a human
to read. In a terminal, that's what it is. But when the client launches your
server, nobody is looking at stdout except a parser with very firm opinions about
what a line should contain.

{% capture alt %}A cream-colored Teletype ASR-33 terminal with a roll of paper and a punched-tape reader, on display at the Computer History Museum{% endcapture %}
{% capture caption %}The human stdout was built for: a Teletype ASR-33. Photo: [ASR-33 at CHM](https://commons.wikimedia.org/wiki/File:ASR-33_at_CHM.agr.jpg) by ArnoldReinhold, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).{% endcapture %}
{% include figure.html src="/assets/blog/stdout-is-not-yours/teletype-asr-33.jpg" alt=alt caption=caption %}

Now trace what happens when your server logs something. Maybe it's a `structlog`
line, or a dependency announcing "loaded model successfully." The line goes to
stdout. The client receives it, tries to parse it as protocol, and rejects it:

```
unrecognized_keys: ["event", "level", "timestamp"]
invalid_value ... path: ["jsonrpc"]
```

Look at those key names. `event`, `timestamp` and `level` are not JSON-RPC
fields. They are your log fields. The client got your log record where it
expected a response, and it has no way to tell a debug message apart from a
malformed reply. (A plain-text line fails one step earlier, as a JSON syntax
error.) So if you see a burst of `invalid_union` and `unrecognized_keys` errors
from a server that starts perfectly in a shell, this is the first thing to check.

How much damage each bad line does depends on the client. The reference
TypeScript SDK [reports it as an error and skips it](https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/client/stdio.ts),
so the real reply can still get through. The spec makes no such promise. It says
the server [MUST NOT write anything to its stdout that is not a valid MCP
message](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio).

{% capture alt %}Diagram: the client writes a tools/list request to the server's stdin and parses every line of the server's stdout as JSON-RPC. A JSON-RPC result frame is accepted; a structlog line with event and level keys is rejected. The same log line sent to stderr lands in the client log or your terminal, where nobody parses it.{% endcapture %}
{% capture caption %}Only stdout is read as protocol, so a log line there arrives as a malformed reply.{% endcapture %}
{% include figure.html src="/assets/blog/stdout-is-not-yours/stdio-pipes.svg" alt=alt caption=caption %}

This is one of those cases where running the program by hand actively misleads
you. In the terminal, the log line lands on your screen and looks harmless. Under
the client, the same bytes land in the protocol stream and break it.

So where should the logs go? Stderr. The client doesn't parse it, which makes it
the right destination for every diagnostic byte your server produces. If you use
`structlog`, point its logger factory at `sys.stderr`:

```python
import sys
import structlog

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),  # ← not stdout
)
```

The last line is the fix. Everything the logger emits now goes to fd 2.

Don't call `print()` in any runtime path. A bare `print()` writes to stdout by
definition. The one you left in an error branch you rarely hit will corrupt the
protocol on the day that branch finally runs. If you really need it, write
`print(..., file=sys.stderr)`, though the logger is the better choice.

Your dependencies count too. A library that prints a banner or a progress bar to
stdout poisons the channel just as well as your own code does. Import such
libraries with that in mind, and silence the chatty ones.

Okay, so why didn't the tests catch this? The tests never looked. A typical unit
test imports a function and checks its return value. It doesn't launch the server
as a subprocess and read stdout the way a real client does. The bug lives entirely
in the integration, and that's the one place the suite doesn't go.

The remedy is a small stdio smoke test. Spawn the server as a subprocess, send a
`tools/list` request the way your protocol revision expects, and assert that every
line that comes back on stdout is clean, parseable JSON-RPC listing the tools you
expect. For revision 2025-11-25 and earlier, that means an `initialize` request,
then the [`notifications/initialized` notification](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle),
then `tools/list`. Revision 2026-07-28 [removed that handshake](https://modelcontextprotocol.io/specification/2026-07-28/changelog):
each request carries its protocol version in `_meta`, and a `server/discover`
call up front is optional.
Run it before you tell anyone the server works. If a log line is leaking, the test
fails right away. It also catches import-time crashes and startup failures on an
empty config in the same run.

**Postscript:** The `JSONRenderer` in the configuration above has a side effect
on Windows. It serializes with `json.dumps`, which [escapes non-ASCII
characters by default](https://docs.python.org/3/library/json.html#json.dump), so
every log line is plain ASCII. Up to Python 3.14,
a piped stderr there [uses the ANSI code page](https://docs.python.org/3.14/library/sys.html#sys.stdout),
such as `cp1252`, while the spec describes stderr output as UTF-8. Python won't
crash on a stray emoji, because stderr [always uses the `backslashreplace` error
handler](https://docs.python.org/3/c-api/init_config.html#c.PyConfig.stdio_errors),
but an accented character would reach the client as a byte that isn't valid
UTF-8. Python 3.15 [turns on UTF-8 mode by default](https://docs.python.org/3/library/os.html#utf8-mode),
which removes the mismatch, and the escaping still covers older interpreters.

**Exercise:** When you run the server by hand, `print("hello")` and
`print("hello", file=sys.stderr)` both show up in your terminal, and they look
identical. Explain why only one of them breaks the connection when the client
launches the server.

{% capture answer %}
In your terminal, file descriptors 1 and 2 both point at the same tty. Both lines land on your screen, and the only thing reading them is you.

When the client launches the server, fd 2 is inherited or routed to the client's log, and nobody parses it. fd 1 is different. The client replaces it with a pipe and reads every line on that pipe as a JSON-RPC message. `hello` isn't JSON, so the parse fails.
{% endcapture %}
{% include answer.html body=answer %}
