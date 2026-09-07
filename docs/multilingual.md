# ORCA multilingual support

ORCA currently exposes English, Hindi (Devanagari), and Hinglish (`hi-Latn`)
as supported deterministic modes. Tamil input/output is enabled as **BETA**;
Telugu, Malayalam, Kannada, Bengali, Odia, Gujarati, and Marathi are represented
in the capability model but are not enabled in the UI.

Language detection uses Unicode script ranges for Devanagari and Tamil plus a
small variant-tolerant Hinglish signal set. Structured extraction and all agents
continue to use canonical intent, tool, severity, unit, coordinate, and evidence
values. Response language precedence is explicit request, detected current
message, conversation language, user preference, then English.

LocalizationService owns labels, capability metadata, and protected-fact checks.
Technical names and acronyms (PFZ, SST, INCOIS, IMD) remain unchanged. Numeric
facts and units must be preserved exactly; unavailable, stale, and demo status
must remain visible in every language. LLM localization may be added later, but
deterministic safety templates are the fallback when LLMs are disabled.

To add a language: add a capability, UI dictionary, terminology and safety
templates, then add script, intent, multi-turn, and protected-fact tests before
marking it supported.
