# Voice guide: The Old New Thing

This is the voice for the blog's posts on AI-agent security and MCP servers. It is
modelled on Raymond Chen's *The Old New Thing*, from a reading of 54 posts dated
2003 to 2026 (listed at the end). Quotes are verbatim, with apostrophes
straightened. Where Chen and the house rules disagree (exclamation marks, the
Exercise), the house rule wins, and the guide says so.

## 1. The voice in one paragraph

A senior engineer explains to a capable colleague why something behaves the way it
does. The post opens on a concrete report or question and answers it within a
paragraph or two. The rest is the mechanism, walked step by step through real
evidence: an error code, a stack, a config line, a log. The reader's likely wrong
theory gets said out loud, in quotes, and then taken apart by showing what
actually happens. Sentences are plain and mostly medium length, broken up now and
then by a two-word one ("Deadlock."). Humor is dry and goes into analogies,
parentheticals and footnotes, never into the diagnosis. Guesses are labelled once,
in ordinary words, and rules are stated flatly. Nothing is sold. The post stops
when the point has been made, often on the last fact.

## 2. Principles

### 1. Open on the report, not the background

The first sentence is the reported symptom, the question as asked, or a flat
claim. The second sentence makes it a puzzle. No scene-setting, no "In today's
landscape".

> "A customer reported that their application would sometimes hang trying to open a file."
> https://devblogs.microsoft.com/oldnewthing/20181029-00/?p=100075
>
> "Not every code injection bug is a security hole."
> https://devblogs.microsoft.com/oldnewthing/20060508-22/?p=31283

- **Do:** "A customer reported that their MCP server passed every test in a terminal and failed every handshake under Claude Desktop."
- **Don't:** "As AI agents become increasingly integrated into enterprise workflows, the security of the Model Context Protocol has never been more important."

### 2. Answer first, then explain

When the title asks a question, answer it near the top, often with "No," "Yes," or
"Well," and spend the rest of the post on why. A psychic diagnosis also goes up
front.

> "No, changing a page to no-access does not free it."
> https://devblogs.microsoft.com/oldnewthing/20231019-00/?p=108907
>
> "Well, there isn't one any more."
> https://devblogs.microsoft.com/oldnewthing/20080325-00/?p=23013

- **Do:** "No, marking a tool `readOnlyHint: true` does not make it read-only. It's a hint to the client. The server still runs whatever the handler does."
- **Don't:** "To answer this question, we first need to understand how tool annotations work. Let's start with some background."

### 3. Say the wrong assumption out loud, then take it apart

Put the reader's plausible theory in quotation marks, as if the reader had just
said it ("Now, you might say, '…'"). Then answer it with mechanism, not with
scolding. "Aha, but you see" and "We tried that. It didn't work." are the turn.

> "We tried that. It didn't work."
> https://devblogs.microsoft.com/oldnewthing/20031212-00/?p=41523
>
> "Aha, but you see, your thread did create a window."
> https://devblogs.microsoft.com/oldnewthing/20260522-00/?p=112348

- **Do:** Now, you might say, "The system prompt tells the model never to call `delete_repo`, so the tool is safe to expose." Aha, but the system prompt is text, and so is the README the agent just fetched.
- **Don't:** "Many developers mistakenly believe that system prompts provide security. This is a common misconception."

### 4. Look at what actually happens

The heart of the post is evidence in order: the error, the log line, the request on
the wire, and what each step tells you. Show it, then read it. Chen often finds
that the symptom was misnamed.

> "Hey, the call returned after all. It didn't hang."
> https://devblogs.microsoft.com/oldnewthing/20230407-00/?p=108026
>
> "Let's look at the error message more closely."
> https://devblogs.microsoft.com/oldnewthing/20110210-00/?p=11533

- **Do:** Show the client's actual `invalid_union` error and point at the key names `event` and `level`: "Those aren't JSON-RPC fields. They're your log fields."
- **Don't:** "There are several possible reasons the connection could fail, including configuration issues, transport problems, or protocol mismatches."

### 5. Psychic debugging: the simplest theory that fits

State the theory as a confident guess ("My psychic powers tell me…"), give the
one-step reasoning that got you there, and then say whether it was confirmed. If
nobody wrote back, say that too. The point is to show the reasoning, not to look
clever.

> "My psychic powers tell me that the thread didn't actually exit."
> https://devblogs.microsoft.com/oldnewthing/20260415-00/?p=112235
>
> "I didn't, but it was the simplest theory that fit the (extremely limited) data."
> https://devblogs.microsoft.com/oldnewthing/20110210-00/?p=11533

- **Do:** "My psychic powers tell me the server is fine and the client is launching a different Python. `uv run` in your shell picks up the project venv; the client's `command` field says `python`."
- **Don't:** "After extensive analysis of multiple potential root causes, we identified the most likely explanation."

### 6. For security claims, ask who the attacker is, who the victim is, and what was gained

This is Chen's one fixed three-part move, and it is a method, not decoration. If
the attacker already had the power the "exploit" grants, it's the other side of
the airtight hatchway. Homely analogies (the burglar already inside the house)
make the point.

> "As usual, we have to look at who the attacker is, who the victim is, and what the attacker has gained."
> https://devblogs.microsoft.com/oldnewthing/20250902-00/?p=111544
>
> "It is not surprising that an attacker with administrator access can gain administrator access."
> https://devblogs.microsoft.com/oldnewthing/20240723-00/?p=110032

- **Do:** "Who is the attacker? Someone who can edit `claude_desktop_config.json`. Who is the victim? The user whose config it is. What did the attacker gain? The ability to run a command as that user, which they already had."
- **Don't:** "This critical vulnerability could allow threat actors to compromise MCP environments."

### 7. Hedge once, in plain words, where the inference is; don't hedge rules

Chen marks a guess with a short clause ("I wasn't there, but I can guess.", "I
suspect", "My guess is") and then goes on at normal confidence. He doesn't
announce a hedging scheme or apologize. A rule gets no qualifier at all.

> "I wasn't there, but I can guess."
> https://devblogs.microsoft.com/oldnewthing/20260914-00/?p=112696
>
> "Note that I don't know whether any file systems actually break this unwritten rule."
> https://devblogs.microsoft.com/oldnewthing/20260914-00/?p=112696

- **Do:** "Nobody has said how the agent got past the login. My guess is the sandbox had a live route out, since the vendor's first fix was to block one."
- **Don't:** "Everything below is inference, and I'll mark it. It may be that, potentially, the sandbox could perhaps have had network access."
- **Rule, unhedged:** "A stdio server must not write anything but protocol to stdout." Not "it's generally best to avoid writing to stdout where possible."

### 8. Medium sentences, with short ones as punctuation

Most sentences are one plain clause or two. Every few paragraphs a very short one
lands a result. Paragraphs are two to five sentences, and a one-line paragraph is
normal. No semicolon chains, no stacked subordinate clauses.

> "Deadlock."
> https://devblogs.microsoft.com/oldnewthing/20181029-00/?p=100075
>
> "That's all very interesting, but what is the vulnerability? / They never said."
> https://devblogs.microsoft.com/oldnewthing/20230118-00/?p=107725

- **Do:** "The proxy forwards the token to the upstream API. The upstream API trusts it. Confused deputy."
- **Don't:** "The proxy, which—crucially—forwards the token (unmodified, as it turns out) to the upstream API, which in turn trusts it implicitly, thereby creating a classic confused-deputy scenario."

### 9. Dry humor, in the margins

The jokes go in analogies, parentheticals, footnotes and Bonus chatter. They are
understated and usually take an absurd idea to its literal conclusion. Never joke
in the diagnosis itself, and never about real people's harm.

> "Windows isn't going to try to solve a philosophical conundrum from ancient Greece."
> https://devblogs.microsoft.com/oldnewthing/20250902-00/?p=111544
>
> "A program that refuses to generate any output is certainly secure, but it's also not very useful."
> https://devblogs.microsoft.com/oldnewthing/20240416-00/?p=109668

- **Do:** "The server could refuse to return any data that might later be pasted somewhere unsafe. That server would be very secure, and nobody would install it."
- **Don't:** "Spoiler: the AI did NOT stay in its lane 😅" or a paragraph-long extended joke.

### 10. The customer is a source of facts, not a target

Report what they saw, what they concluded, and what they tried, fairly. Credit
cooperation. One wry line is the limit, and it is aimed at the situation. Say
whether the fix was confirmed.

> "The customer was kind enough to share their source code"
> https://devblogs.microsoft.com/oldnewthing/20230407-00/?p=108026
>
> "We never did learn why the customer requires write access in order to extract a thumbnail from a file."
> https://devblogs.microsoft.com/oldnewthing/20181029-00/?p=100075

- **Do:** "The team concluded the model had gone rogue. That's a reasonable first theory, but the tool log shows the model only called tools the harness offered it."
- **Don't:** "Incredibly, the developers never thought to check stdout." / "The vendor's embarrassing failure…"

### 11. Code: short, introduced in one sentence, read in prose right after

Show the smallest snippet that carries the point, introduce it with one plain
sentence ("Here's a sketch of a solution."), and explain it immediately underneath.
Mark the important line with a comment such as `// Flawed design - see discussion`
or `← died here`. Use placeholder names like Contoso and widget. Show the bad
version before the good one.

> "Here's a sketch of a solution."
> https://devblogs.microsoft.com/oldnewthing/20260514-00/?p=112322
>
> "Take the scratch program and make the following changes:"
> https://devblogs.microsoft.com/oldnewthing/20181025-00/?p=100055

- **Do:** "Here's the handler as shipped:" (eight lines, with `# ← path joined before it's checked`), then "The check runs on the string, not on the resolved path."
- **Don't:** A 60-line file dump introduced with "Below is a comprehensive implementation that demonstrates best practices."

### 12. Paragraphs carry the structure, not headings

In the 54 posts read, Chen used **no section headings at all**. He moves on with
transitions ("Okay, so…", "Now…", "But…", "Okay, next question:"). Asides go in
numbered footnotes (¹ ²). "Bonus chatter:" and "Exercise:" are bold inline
labels, not headings.

> "I'm going to answer the questions in the wrong order."
> https://devblogs.microsoft.com/oldnewthing/20200207-00/?p=103416

- **Do:** Run a 900-word debugging post as plain paragraphs, and start the next part with "Okay, so the server is fine. What about the client?"
- **Don't:** Put a `##` heading over every three paragraphs ("## Background", "## The Problem", "## Key Takeaways").

### 13. Stop when it's done

The ending is the last fact, a short kicker, or a "Next time" pointer. There is
never a summary paragraph and never a moral to finish on. A TL;DR shows up once in
54 posts.

> "And it didn't involve a global conspiracy."
> https://devblogs.microsoft.com/oldnewthing/20110210-00/?p=11533
>
> "I thought you might appreciate me pointing out the trick, that's all."
> https://devblogs.microsoft.com/oldnewthing/20260914-00/?p=112696

- **Do:** End on "Re-enabling the egress proxy fixed it." Then Bonus chatter and Exercise, if any.
- **Don't:** "In the end, MCP security isn't about tools. It's about trust." / "The lesson is clear: …"

### 14. Series posts link with one sentence

Part 2 starts with "Last time, …" in one clause and goes straight on. A post that
isn't finished says so ("Next time, …", "We'll take up this issue next time.").

> "Last time, we looked at the 'state' that powers the std::promise … classes."
> https://devblogs.microsoft.com/oldnewthing/20261013-00/?p=112769
>
> "Next time, a look at device contexts."
> https://devblogs.microsoft.com/oldnewthing/20051010-09/?p=33843

- **Do:** "Last time, we saw that the client parses all of stdout. Today: what it does with stderr."
- **Don't:** "In our previous installment of this ongoing series exploring MCP transport security, we discussed…"

## 3. Post template

1. **Title.** A question, a "The case of the …" title, or a flat claim. The title
   carries the thesis, so the body doesn't need a heading for it.
2. **Opening (1–3 short paragraphs).** The report or question in concrete terms:
   the command, the error, what the person expected. Then the puzzle in one
   sentence ("Nothing crashed. So why won't it connect?"). For an incident post,
   the sourced fact comes first and the question second.
3. **Answer or theory.** One or two sentences: "No, …", "My psychic powers tell
   me …", or "The short version is that the client is reading stdout."
4. **Middle.** Look at what actually happens, in order. Evidence, then what it
   means, one step per paragraph or two. Quote the reader's wrong theory and
   correct it there. For security claims, go through attacker, victim and gain.
   Code goes in where it proves something. Mark any inference once, where it
   happens.
5. **Fix or rule.** Stated flatly. The good version of the code, if there is one.
   Say what is still unknown.
6. **Stop.** Last fact, short kicker, or "Next time".
7. **Bonus chatter (optional, about 1 post in 5 for Chen).** One to three
   paragraphs on a related oddity: history, an ironic detail, a second meaning,
   a correction. It must add a fact, not restate the post. "Bonus bonus chatter"
   is allowed once in a while.
8. **Exercise (house rule: every post).** One question, one to three sentences,
   that makes the reader apply the mechanism to a nearby case. Not a quiz on the
   post's text. The answer goes in the collapsed spoiler
   (`{% include answer.html body=answer %}`). It is short, gives the mechanism,
   and ends on the last fact, not an aphorism. Chen uses Exercise rarely (3 of
   54); we use it every time, so keep it modest.

Length: Chen ranges from 60 words to about 2,000. Most are 300–700. Shorter is fine
when the point is small.

## 4. Signature phrases, and how often to use them

Frequencies are from the 54 posts read. Going much over these rates turns the
voice into parody.

| Phrase | Chen's rate | House budget |
|---|---|---|
| "A customer reported that…" / "A security vulnerability report arrived…" | most debugging and security posts | Opening only, and only when there was a real report. For composites use "Suppose…" |
| "Suppose…" / "Say you have…" | about 1 in 4 | Fine for hypotheticals |
| "My psychic powers tell me…" | about 1 in 5, almost all in debugging posts | At most once per post, and only for a real guess you then check |
| "Okay, so…" / "Okay, that's nice. But…" / "Okay, next question:" | about 1 in 5 | Once or twice per post |
| "Well, …" / "Now, …" / "Of course, …" / "In other words, …" | each about 1 in 7 | Freely, but not two in a row |
| "Let's look at…" / "Let's see…" / "Let's practice." | about 1 in 8 | Once per post, to start the evidence |
| "Now, you might say, '…'" / "Aha, but you see…" | a few posts | Once per post at most |
| "Do you see the problem?" | rare | Once in a while, right before the reveal |
| "Last time…" / "Next time…" | series posts | Series posts only |
| "Remember that…" / "Recall that…" | rare | Only to point back to an earlier post |
| "Bonus chatter:" | about 1 in 5 | Optional, only with a real extra fact |
| "Exercise:" | 3 in 54 | Every post (house rule) |
| Footnotes ¹ ² | about 1 in 4 | For asides that would break the flow |
| "It rather involved being on the other side of this airtight hatchway" | a whole series | Allusion at most; don't copy the title formula |
| "It's not X, it's Y" | 0 in 54 | Avoid |
| Em dash | 5 in 54 posts in total | At most one per post |

## 5. Anti-patterns

These break the voice. Most are common LLM habits.

- **Throat-clearing:** "In today's rapidly evolving AI landscape", "Let's dive in", "Before we begin", "In this post, we'll explore".
- **Signposting filler:** "It's worth noting that", "It's important to understand", "Notably", "Interestingly", "Importantly". Just state the fact.
- **"Here's the thing", "Here's why that matters", "The catch?",** "Spoiler:".
- **Vocabulary tics:** delve, leverage, robust, seamless, crucial, navigate, landscape, realm, tapestry, unlock, empower, game-changer, "a testament to".
- **Meta commentary about your own hedging:** "So everything below is inference, and I'll mark it." "To be clear about what we know and don't know…" Mark the inference where it happens, in one clause, and move on.
- **Em-dash pileups.** More than one em dash per post, or two in one sentence. Use a period or parentheses.
- **Reflexive triplets:** "fast, reliable, and secure"; three parallel short sentences; "It needs a goal, a refusal, and a path." Use two items or four if that's what's true. The attacker/victim/gain check is the exception because it's a method.
- **Grand closing aphorisms:** "A log that nobody reads is a diary." "Trust is the real attack surface." "The model can still have a second idea. The idea just never reaches the network." One is tolerable in a whole post, never as the last line.
- **Summary paragraphs and "In conclusion",** "To sum up", "Key takeaways", "The bottom line".
- **Exclamation marks.** House rule: none. Chen uses a few ("The reportedly unquoted service path is quoted!"); turn them into periods. The flat line is funnier anyway.
- **Emoji**, ALL-CAPS emphasis, bold scattered through the prose.
- **Marketing and hype:** "powerful", "cutting-edge", "next-generation", vendor praise, calls to action, "Check out our…" links worked into sentences.
- **Alarm words** for things you haven't shown: "critical", "devastating", "massive breach". Say what happened and let the reader decide.
- **Rhetorical question chains** ("But what does this mean? And why should you care?"). One question, then answer it.
- **Over-extended metaphors.** Chen's analogies run one to three sentences (burglar, prisoner's keys, sci-fi shields) and then he drops them. Don't carry one metaphor through a whole section and back again in the closing line.
- **"Not X, but Y" reframes** in every section ("This isn't a bug. It's a design choice.").
- **Hedge stacking:** "may potentially", "could possibly", "it seems likely that perhaps".
- **Mocking named people,** including officials or report finders. Mock the claim, briefly.
- **Headings as outline:** "Background", "The Problem", "The Solution", "Conclusion".
- **Fabrication.** No invented quotes, numbers, dates or mechanisms. If it isn't sourced, say it's unknown or label it as a guess.

## 6. Where the current house style drifts

### `_posts/2026-07-02-stdout-is-not-yours.md`

Mostly close. The opening ("Suppose someone reports the following…"), the key-name
reading ("Look at those key names."), "Stderr." as a one-word answer, and the
wrong-assumption paragraph ("You might think of stdout as…") are all on voice.
Drift:

- **Five `##` headings** ("Who is reading stdout?", "So where should the logs go?", "Why didn't the tests catch this?", plus Bonus chatter and Exercise). Chen would use none. Fold the first three into transitions ("So where should the logs go? Stderr."). Make Bonus chatter and Exercise bold inline labels unless the layout needs them as headings.
- **"Let's look at what the client is actually doing."** as a paragraph of its own is a signpost. Chen does the look straight away, or puts the "Let's" in front of the evidence.
- **"Two rules follow, and there's no wiggle room in either of them."** announces how firm the rules are. Just state them.
- **"Same program and the same output, but a different reader."** and the spoiler's last line, **"What changed is who is on the other end of fd 1."**, are closing aphorisms in the not-X-but-Y shape. End the answer on the fd 1 pipe fact.
- **"It's one less platform surprise to debug."** restates the Bonus chatter's point. Cut it and stop on the `cp1252` fact.
- **Photo figure** (Teletype). Chen almost never uses decorative images. Diagrams that prove something are fine. Decoration is a house choice, not the voice.

### `_posts/2026-10-14-why-did-an-eval-agent-end-up-in-a-medicare-portal.md`

Good sourcing, and the inference is mostly marked well ("You don't add 'block live
internet' unless the internet was live. So the sandbox almost certainly had a door
to the outside." is exactly right). Drift:

- **Opening.** Two sentences of press-conference context come before the question. Chen would lead with the event ("In June, an agent in an OpenAI training or evaluation run got into a Medicare statistics portal it was not allowed into.") and ask the question in sentence two.
- **Headings everywhere,** including `###` subheads and thesis headings ("The agent did what the loop told it to do"). The thesis belongs in the prose. A long incident post can keep a timeline table, but go to two or three headings at most, or none.
- **The paperclip maximizer** runs a whole paragraph and comes back as the section's last line ("A paperclip maximizer behind a default-deny network makes paperclips out of whatever is on the list."). Chen's analogies are one or two sentences and don't come back. Cut it to one sentence or drop it.
- **Aphorisms as section endings:** "A log that nobody reads in real time is a diary." "None of these ask the model to be good." The spoiler ends with "The model can still have a second idea. The idea just never reaches the network." Keep one at most, and not last.
- **Triplet:** "It needs a goal, a refusal it treats as an obstacle, and a network path to try the next idea on." Rewrite as two plain sentences.
- **Jab at a named official:** "which is a fine sentence and tells you nothing about the fence." Chen ribs claims, not people. Say instead "The government hasn't described the fence."
- **Self-promotion:** "[/you-are-the-model/] puts you in its seat." and links in the controls section read as calls to action. Chen links quietly, inline or as "Related:".
- **Missing move:** the security part never asks who the attacker, victim and gain were. Here that's the interesting case: the "attacker" is an unattended loop, the victim is a third party, and nobody gained anything except the answer to a research question.
- **Corrections block.** Good practice and in the voice (Chen does it too: "Correction: The declaration above is for preview handlers", 2018). Keep it.

## 7. Self-check before publishing

Run through these on the finished draft.

1. Does the first sentence state a concrete report, question or claim? Is the puzzle clear by the second?
2. Is the question answered (or the theory stated) within the first few paragraphs?
3. Is the reader's wrong theory said out loud and answered with mechanism?
4. Is there real evidence (error text, log, config, code) and does the prose read it?
5. For any security claim: are attacker, victim and gain stated? Is a hatchway crossed?
6. Is every guess marked once, in a plain clause, at the point where it's made? Are rules stated without qualifiers? Is anything stated as fact that isn't sourced?
7. Search for `!`. There should be none.
8. Search for `—`. One at most.
9. Search for: worth noting, delve, here's the thing, crucial, robust, landscape, leverage, in conclusion, key takeaways, importantly, interestingly.
10. Any three-item list or three-sentence parallel run? Make it two, or the true number.
11. Read the last sentence of the body, of the Bonus chatter, and of the spoiler. Is any of them an aphorism or a restatement? End on a fact instead.
12. Count headings. Is each one really needed? (Chen: zero.)
13. Do the humor lines sit in analogies, parentheticals or footnotes, and is none of them aimed at a person or at harm?
14. Is every code block introduced in one sentence and explained right after?
15. Does the Exercise ask the reader to apply the mechanism to a new case, with a short answer in the spoiler?
16. Read it aloud. Does it sound like one engineer talking to another at a whiteboard, or like a press release?

## Posts read

- https://devblogs.microsoft.com/oldnewthing/20031209-00/?p=41573 (never suspend a thread) · https://devblogs.microsoft.com/oldnewthing/20031212-00/?p=41523 (structure sizes)
- https://devblogs.microsoft.com/oldnewthing/20031224-00/?p=41363 (block undocumented apps) · https://devblogs.microsoft.com/oldnewthing/20031230-00/?p=41273 (CreateMenu vs CreatePopupMenu)
- https://devblogs.microsoft.com/oldnewthing/20040721-00/?p=38383 (nine monitors) · https://devblogs.microsoft.com/oldnewthing/20040722-00/?p=38373 (trap TerminateProcess)
- https://devblogs.microsoft.com/oldnewthing/20050919-13/?p=34153 (UPS) · https://devblogs.microsoft.com/oldnewthing/20051007-11/?p=33863 (profiling tools)
- https://devblogs.microsoft.com/oldnewthing/20051010-09/?p=33843 (thread affinity, part 1) · https://devblogs.microsoft.com/oldnewthing/20060502-07/?p=31333 (cache with a bad policy)
- https://devblogs.microsoft.com/oldnewthing/20060508-22/?p=31283 (airtight hatchway) · https://devblogs.microsoft.com/oldnewthing/20060509-30/?p=31263 (Internet-facing)
- https://devblogs.microsoft.com/oldnewthing/20070423-00/?p=27163 (assume it's mostly correct) · https://devblogs.microsoft.com/oldnewthing/20071228-00/?p=24003 (deadlock, follow the money)
- https://devblogs.microsoft.com/oldnewthing/20080325-00/?p=23013 (int vs INT) · https://devblogs.microsoft.com/oldnewthing/20080506-00/?p=22443 (ExitProcess(1))
- https://devblogs.microsoft.com/oldnewthing/20100128-00/?p=15153 (hard-coded Notepad) · https://devblogs.microsoft.com/oldnewthing/20110210-00/?p=11533 (sabotaged from above)
- https://devblogs.microsoft.com/oldnewthing/20131127-00/?p=2553 (DLL that refuses to load) · https://devblogs.microsoft.com/oldnewthing/20140131-00/?p=1913 (non-psychic: collection not empty)
- https://devblogs.microsoft.com/oldnewthing/20150310-00/?p=44503 ("simply") · https://devblogs.microsoft.com/oldnewthing/20150311-00/?p=44493 (copying a program)
- https://devblogs.microsoft.com/oldnewthing/20150313-00/?p=44473 (nonsense instruction, ep. 2) · https://devblogs.microsoft.com/oldnewthing/20170221-00/?p=95515 (command prompt error)
- https://devblogs.microsoft.com/oldnewthing/20181025-00/?p=100055 (trackbar, part 1) · https://devblogs.microsoft.com/oldnewthing/20181029-00/?p=100075 (oplock deadlock)
- https://devblogs.microsoft.com/oldnewthing/20190405-00/?p=102389 (ERROR_BROKEN_PIPE) · https://devblogs.microsoft.com/oldnewthing/20200207-00/?p=103416 (display settings)
- https://devblogs.microsoft.com/oldnewthing/20220927-00/?p=107217 (Microspeak: break glass) · https://devblogs.microsoft.com/oldnewthing/20221122-00/?p=107436 (Microspeak: breaking into jail)
- https://devblogs.microsoft.com/oldnewthing/20230118-00/?p=107725 (hatchway: modifying user's files) · https://devblogs.microsoft.com/oldnewthing/20230407-00/?p=108026 (PasswordVault "hang")
- https://devblogs.microsoft.com/oldnewthing/20231019-00/?p=108907 (PAGE_NOACCESS vs freeing) · https://devblogs.microsoft.com/oldnewthing/20240416-00/?p=109668 (output exfiltrated)
- https://devblogs.microsoft.com/oldnewthing/20240723-00/?p=110032 (unquoted service paths) · https://devblogs.microsoft.com/oldnewthing/20241112-00/?p=110507 (Windows 95 setup)
- https://devblogs.microsoft.com/oldnewthing/20241210-00/?p=110626 (hatchway: AMSI) · https://devblogs.microsoft.com/oldnewthing/20250417-00/?p=111079 (feature flag, part 1)
- https://devblogs.microsoft.com/oldnewthing/20250902-00/?p=111544 (ZIP passwords) · https://devblogs.microsoft.com/oldnewthing/20250925-00/?p=111627 (sample comments)
- https://devblogs.microsoft.com/oldnewthing/20251029-00/?p=111738 (CFG crash) · https://devblogs.microsoft.com/oldnewthing/20251120-00/?p=111803 (commit-on-demand exercise)
- https://devblogs.microsoft.com/oldnewthing/20251229-00/?p=111927 (low memory) · https://devblogs.microsoft.com/oldnewthing/20260415-00/?p=112235 (thread exit delay)
- https://devblogs.microsoft.com/oldnewthing/20260514-00/?p=112322 (delete all but 10 files) · https://devblogs.microsoft.com/oldnewthing/20260522-00/?p=112348 (STA must pump)
- https://devblogs.microsoft.com/oldnewthing/20260701-00/?p=112498 (hatchway: admin settings) · https://devblogs.microsoft.com/oldnewthing/20260812-00/?p=112607 (code vs PR comments)
- https://devblogs.microsoft.com/oldnewthing/20260901-00/?p=112662 (Microspeak: funded) · https://devblogs.microsoft.com/oldnewthing/20260903-00/?p=112672 (progress callback)
- https://devblogs.microsoft.com/oldnewthing/20260914-00/?p=112696 (ReadDirectoryChangesW renames) · https://devblogs.microsoft.com/oldnewthing/20260925-00/?p=112731 (nonsense instruction, ep. 3)
- https://devblogs.microsoft.com/oldnewthing/20261012-00/?p=112767 (C++ futures, part 1) · https://devblogs.microsoft.com/oldnewthing/20261013-00/?p=112769 (C++ futures, part 2)
