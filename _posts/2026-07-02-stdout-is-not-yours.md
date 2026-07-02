---
layout: post
title: "Your MCP Server \"Won't Connect\"? Stop Printing to Stdout."
subtitle: "In a stdio MCP server, stdout belongs to JSON-RPC. One stray log line and the client drowns you in unrecognized_keys errors."
description: >-
  A stdio MCP server that runs fine in a terminal but 'won't connect' to the
  client is almost always writing logs to stdout. Stdout is reserved for
  JSON-RPC — here's why one log line corrupts the protocol, and the one-line
  structlog fix.
date: 2026-07-02
permalink: /blog/stdout-is-not-yours/
tags: [mcp, debugging]
reading_time: "4 min read"
---

You built an MCP server. It starts cleanly in a terminal. `uv run my-mcp` prints
your startup banner, no traceback, exit code 0. Then you point Claude Desktop at
it and the client throws a wall of schema errors and reports the server as failed.
Nothing in your code "crashed." So what happened?

You logged to stdout. And in a stdio MCP server, **stdout isn't yours.**

## Stdout is the wire, not a log

A stdio MCP server speaks JSON-RPC over exactly two pipes: it **reads** requests
from stdin and **writes** responses to stdout. That's the transport. stdout is not
a place to print things — it *is* the protocol channel. The client is on the other
end parsing every line it receives as a JSON-RPC message.

So the moment anything that isn't a JSON-RPC message lands on stdout — a
`structlog` line, a stray `print()`, a library's "loaded model successfully"
banner, a warning from a dependency — the client dutifully tries to parse it as
protocol and rejects the whole exchange:

```
unrecognized_keys: ["warning", "event", "timestamp", "level"]
invalid_value ... path: ["jsonrpc"]
```

If you've seen a burst of `invalid_union` / `unrecognized_keys` errors and a server
that "won't connect" despite starting perfectly in a shell, look at those key
names. `event`, `timestamp`, `level` — those aren't protocol fields. **Those are
your log fields.** Your logger is talking on the wire, and the client can't tell
your debug output apart from a malformed response.

This is why the terminal fools you. In a terminal, stdout is just your screen, so a
log line looks harmless. Under the client, stdout is a socket with a strict grammar,
and the same line is a protocol violation.

## The fix: everything that isn't JSON-RPC goes to stderr

stderr is free. The client doesn't parse it, so it's the correct destination for
every diagnostic byte your server emits. If you use `structlog`, point its logger
factory at `sys.stderr` and you're done:

```python
import sys
import structlog

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),
)
```

Two rules follow from this, and they're absolute:

1. **No `print()` in any runtime path.** A bare `print()` writes to stdout by
   definition. One of them, buried in an error branch you rarely hit, will corrupt
   the protocol the day it fires. If you must, `print(..., file=sys.stderr)` — but
   prefer the logger.
2. **Watch your dependencies.** Libraries that print banners or progress bars to
   stdout will poison the channel just as effectively as your own code. Import them
   knowing that, and silence anything chatty.

A nice side effect of the `JSONRenderer` above: it escapes non-ASCII, so your
stderr logs stay clean even on a Windows `cp1252` console that would otherwise
choke on a stray emoji or box-drawing character. One fewer platform surprise.

## Catch it before the client does

The reason this bug is so common is that unit tests never see it. Your tests import
functions and assert on return values — they never launch the server as a
subprocess and read its stdout the way a real client does. So the one class of bug
that actually breaks the integration is the one your suite is blind to.

Add a tiny **stdio smoke test**: spawn the server as a subprocess, send an
`initialize` then a `tools/list` request, and assert that what comes back on stdout
is clean, parseable JSON-RPC with the tools you expect. If a log line is leaking,
this test fails immediately — and it catches a couple of its cousins (import-time
crashes, empty-config startup failures) in the same run. Run it before you ever
tell someone the server works.

## The one-line takeaway

In a stdio MCP server, **stdout is the protocol and stderr is for you.** Send one
byte of logging to the wrong pipe and the client will tell you the server "won't
connect" while giving you no obvious reason why. Route every log and every `print`
to stderr, and the mystery disappears.

