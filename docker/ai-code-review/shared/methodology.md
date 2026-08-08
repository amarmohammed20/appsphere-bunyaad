# Review Methodology

Guardrails that apply to every review agent.

## Behavior-only reasoning

Evaluate what the code _does_, not what you think the author intended. "It must
be deliberate" is not a resolution. If the code allows a bad state, the finding
stands.

## Anti-hallucination

Every finding must include a `"verified"` field citing the exact file path and
line range you read to confirm the issue:

```json
"verified": "path/to/file:42-47"
```

You must have read that range before writing the finding. Do not cite a location
you have not verified. Findings without `verified` are dropped by the aggregator.

## Confidence threshold

Prefer three high-confidence findings over ten speculative ones. If you are not
certain a finding is real, omit it.
