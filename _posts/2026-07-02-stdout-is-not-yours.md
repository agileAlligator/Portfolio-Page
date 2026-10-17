---
layout: post
title: "Why does my MCP server run fine in a terminal but refuse to connect?"
subtitle: "The client parses everything on your stdout as JSON-RPC. Your log lines are not JSON-RPC."
description: >-
  A stdio MCP server that starts cleanly in a terminal but fails under the
  client is almost always writing logs to stdout. Stdout carries the JSON-RPC
  messages, so a single log line corrupts the conversation. The fix is to send
  structlog output to stderr.
date: 2026-07-02 14:00:00 +0000
permalink: /blog/stdout-is-not-yours/
image: /assets/og/stdout-is-not-yours.png
tags: [mcp, debugging]
reading_time: "3 min read"
short_title: "Stdout belongs to the protocol"
exhibits: [/mcp/]
---

Suppose someone reports the following. They built an MCP server. They run
`uv run my-mcp` in a terminal, and it prints its startup banner. No traceback,
exit code 0. Then they point Claude Desktop at it, and the client produces a wall
of schema errors and marks the server as failed.

Nothing crashed. So why won't it connect?

Let's look at what the client is actually doing.

## Who is reading stdout?

A stdio MCP server talks to its client over two pipes. It reads requests from
stdin, and it writes responses to stdout. That is the whole transport. The client
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
line, or a stray `print()`, or a dependency announcing "loaded model
successfully." The line goes to stdout. The client receives it, tries to parse it
as protocol, and rejects the exchange:

```
unrecognized_keys: ["warning", "event", "timestamp", "level"]
invalid_value ... path: ["jsonrpc"]
```

Look at those key names. `event`, `timestamp` and `level` are not JSON-RPC
fields. They are your log fields. The client got your log record where it
expected a response, and it has no way to tell a debug message apart from a
malformed reply. So if you see a burst of `invalid_union` and `unrecognized_keys`
errors from a server that starts perfectly in a shell, this is the first thing to
check.

{% capture alt %}Diagram: the client writes a tools/list request to the server's stdin and parses every line of the server's stdout as JSON-RPC. A JSON-RPC result frame is accepted; a structlog line with event and level keys is rejected. The same log line sent to stderr lands in the client log or your terminal, where nobody parses it.{% endcapture %}
{% capture caption %}Three pipes, one parser. Only stdout is read as protocol, so a log line there is a malformed reply.{% endcapture %}
{% include figure.html src="/assets/blog/stdout-is-not-yours/stdio-pipes.svg" alt=alt caption=caption %}

This is one of those cases where running the program by hand actively misleads
you. In the terminal, the log line lands on your screen and looks harmless. Under
the client, the same bytes land in the protocol stream and break it. Same
program and the same output, but a different reader.

## So where should the logs go?

Stderr. The client doesn't parse it, which makes it the right destination for
every diagnostic byte your server produces. If you use `structlog`, point its
logger factory at `sys.stderr`:

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

Two rules follow, and there's no wiggle room in either of them.

1. Don't call `print()` in any runtime path. A bare `print()` writes to stdout by
   definition. The one you left in an error branch you rarely hit will corrupt
   the protocol on the day that branch finally runs. If you really need it, write
   `print(..., file=sys.stderr)`, though the logger is the better choice.
2. Your dependencies count too. A library that prints a banner or a progress bar
   to stdout poisons the channel just as well as your own code does. Import such
   libraries with that in mind, and silence the chatty ones.

## Why didn't the tests catch this?

Because the tests never looked. A typical unit test imports a function and checks
its return value. It doesn't launch the server as a subprocess and read stdout
the way a real client does. The bug lives entirely in the integration, and that's
the one place the suite doesn't go.

The remedy is a small stdio smoke test. Spawn the server as a subprocess, send an
`initialize` request followed by a `tools/list` request, and assert that what
comes back on stdout is clean, parseable JSON-RPC listing the tools you expect.
If a log line is leaking, the test fails right away. As a bonus, it also catches
a couple of related failures in the same run, such as import-time crashes and
startup failures on an empty config. Run it before you tell anyone the server
works.

## Bonus chatter

The `JSONRenderer` in the configuration above has a pleasant side effect: it
escapes non-ASCII characters. That keeps your stderr logs readable even on a
Windows `cp1252` console, which would otherwise choke on a stray emoji or
box-drawing character. It's one less platform surprise to debug.

## Exercise

When you run the server by hand, `print("hello")` and
`print("hello", file=sys.stderr)` both show up in your terminal, and they look
identical. Explain why only one of them breaks the connection when the client
launches the server.
