/* Real résumé data, hand-sourced from avneeshk.me. Static — tool handlers are
   pure functions over this, with NO network/fs/exec, so a hijacked model
   connected to this server cannot be used to attack anything. */

export const RESUME = {
	whoami:
		"Avneesh Kasture — security engineer on Gruve's professional-services team. " +
		"He builds secure MCP servers for enterprise clients (hardening the agentic layer against " +
		"prompt injection, tool misuse, and privilege abuse) and ships internal LLM-powered apps. " +
		"Security-trained, detection-minded, product-focused. Thesis: the model can't police itself, " +
		"so the guardrails belong in deterministic server code the model can't talk its way past.",

	experience:
		"EXPERIENCE\n" +
		"• Solutions Engineer, Professional Services — Gruve (Apr 2026–present, Pune). " +
		"Designs and delivers secure MCP servers for clients; hardens the agentic layer; builds " +
		"internal apps including Helix (AI sales-enablement: GPT-4o SOW pipeline, pricing calculator, " +
		"capability roadmap, Service Navigator).\n" +
		"• Security Operations Center Analyst — Gruve (Apr 2025–Apr 2026, Pune). " +
		"Advanced triage across network/endpoint/auth telemetry with Splunk and CrowdStrike Falcon; " +
		"threat hunting that found a vulnerability and led to a customer-wide advisory.\n" +
		"• Digital Forensics Intern — Deloitte (Jul 2024–Feb 2025, Mumbai). " +
		"Forensic acquisition/analysis; cut a business-critical process's runtime by 80%; " +
		"automated virus scanning and imaging with Python (RPA).",

	skills:
		"TOOLKIT\n" +
		"Secure MCP & Agentic: MCP server design, OWASP Agentic Top 10, prompt-injection defense, " +
		"tool scoping & sandboxing, client delivery.\n" +
		"AI & Automation: LLM workflow orchestration, document-generation pipelines, " +
		"citation/provenance validation, tool-use / function calling, SOAR / playbook automation.\n" +
		"Build & Ship: Python, Docker, internal app development, REST & API integration.\n" +
		"Security Foundations: threat hunting, detection engineering, Splunk, CrowdStrike Falcon, " +
		"Windows forensics, malware analysis.\n" +
		"Certifications: ISC2 Certified in Cybersecurity (CC); Google Cloud & Data Science.\n" +
		"Education: B.Tech, Computer Science & Engineering — Vellore Institute of Technology, 2024.",

	resume:
		"Avneesh Kasture — Secure MCP Engineer / Agentic Security. " +
		"Full résumé PDF: https://avneeshk.me/resume.pdf",

	contact:
		"CONTACT\n" +
		"email: apkasture02@gmail.com\n" +
		"github: https://github.com/agileAlligator\n" +
		"linkedin: https://www.linkedin.com/in/avneesh-kasture-491b651b6/\n" +
		"site: https://avneeshk.me",
};

export const PROJECTS = [
	{ id: "mcploitable", title: "mcploitable", tags: "agentic-security · CTF lab · Python",
	  desc: "The \"Metasploitable of MCP\" — deliberately vulnerable MCP servers, one per class of the OWASP Agentic Top 10. Seven are breakable boxes on an L0→L3 control ladder scored by real effect; the correct deterministic control held 0 for 105 at the wall.",
	  links: "github: https://github.com/agileAlligator/mcploitable · play: https://avneeshk.me/break-this-server/ · writeup: https://avneeshk.me/blog/building-mcploitable/" },
	{ id: "d2c-analyst", title: "d2c-analyst", tags: "agent-safety · provenance · Python",
	  desc: "An AI analyst plus an autonomous Margin Watch agent for D2C brands. Every number is server-side validated against a provenance model before it reaches the user; a gpt-4o-mini → gpt-4o router escalates on complexity, over row-level-secure multi-tenant data.",
	  links: "github: https://github.com/agileAlligator/d2c-analyst" },
	{ id: "helix", title: "Helix @ Gruve", tags: "platform · private",
	  desc: "Internal AI sales-enablement platform: a GPT-4o SOW generation pipeline, automated pricing calculator, engineering capability roadmap, and Service Navigator. Express.js, PostgreSQL, Redis, Prisma on Azure.",
	  links: "live (Entra-gated): https://helix.gruveai.com" },
	{ id: "piidetector", title: "PIIDetector", tags: "security tooling · NLP · Python",
	  desc: "A filesystem-level PII detection tool that scans images, text, Word docs, and PDFs for sensitive-data exposure, with NLP-based entity recognition for structured and unstructured PII.",
	  links: "github: https://github.com/agileAlligator/PIIDetector" },
	{ id: "randomness", title: "Randomness Testing Suites", tags: "research · cryptography",
	  desc: "A comparative analysis of randomness-testing algorithms and suites — methodology and results written up as a research draft.",
	  links: "github: https://github.com/agileAlligator/comparative-analysis" },
	{ id: "seinfeld", title: "Seinfeld Excuse Rolodex", tags: "for fun",
	  desc: "A tiny toy that generates an excuse for every day of the week. Kept around because it still makes him laugh.",
	  links: "open: https://avneeshk.me/seinfeld-rolodex.html" },
];

export const POSTS = [
	{ slug: "guardrails-belong-in-the-server", title: "The Model Can't Police Itself: Put MCP Guardrails in the Server",
	  body: "Security that lives in an MCP server's system prompt is theater — the model is the one component you must assume can be turned against you. Real guardrails live in deterministic code between the model's decision and the side effect: (1) a runtime endpoint allowlist that rejects non-approved calls in code, (2) structured tool returns isolated from the system prompt, (3) output scanning for secrets/PII. Full post: https://avneeshk.me/blog/guardrails-belong-in-the-server/" },
	{ slug: "stdout-is-not-yours", title: "Your MCP Server \"Won't Connect\"? Stop Printing to Stdout.",
	  body: "In a stdio MCP server, stdout is the JSON-RPC wire, not a log. One stray print/log line makes the client reject the whole exchange with unrecognized_keys errors. Send logs to stderr (or a file); keep stdout for protocol. Full post: https://avneeshk.me/blog/stdout-is-not-yours/" },
	{ slug: "building-mcploitable", title: "Building mcploitable: A Lab Where Agent Guardrails Fail on Purpose",
	  body: "mcploitable tests one claim: a control the model can be talked out of is not a control. Each box is a real 2024–2026 incident (EchoLeak, Supabase MCP leak, Vanna.AI RCE, ChatGPT memory poisoning…), on an L0→L3 ladder, scored by whether a canary actually leaves. Recognition and partial controls fall to a good payload; the deterministic wall held 0 for 105. Full post: https://avneeshk.me/blog/building-mcploitable/" },
];
