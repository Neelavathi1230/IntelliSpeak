"""Intent-driven response generation. Replace `generate_reply` with an LLM call if desired
(read credentials from environment variables, never from the frontend)."""
import random

TEMPLATES: dict[str, list[str]] = {
    "greeting": ["Hello! How can I help you today?", "Hi there! What would you like to talk about?"],
    "goodbye": ["Goodbye! Come back any time.", "See you soon!"],
    "thanks": ["You're welcome! Anything else I can help with?"],
    "help": [
        "Happy to help. You can chat with me, or use Text Analysis to see sentiment, intent, "
        "keywords and entities for any text."
    ],
    "complaint": [
        "I'm sorry you're running into that. Could you tell me what happened and when it started?",
        "That sounds frustrating. What were you doing right before the problem appeared?",
    ],
    "feedback": [
        "Thanks for the feedback. What would you like to see improved or added?",
        "Glad to hear it. Is there a feature you'd like to see next?",
    ],
    "question": ["Good question. Could you give me a bit more detail so I can answer it properly?"],
    "general_conversation": ["I see. Tell me more.", "Interesting. What would you like to explore about that?"],
    "unknown": ["I didn't quite catch that. Could you rephrase?"],
}


def generate_reply(analysis: dict, history: list[str] | None = None) -> str:
    intent = analysis["intent"]["intent"]
    reply = random.choice(TEMPLATES.get(intent, TEMPLATES["unknown"]))
    sentiment = analysis["sentiment"]["label"]
    if sentiment == "negative" and intent not in {"complaint", "greeting", "goodbye"}:
        reply = "I'm sorry to hear that. " + reply
    elif sentiment == "positive" and intent == "general_conversation":
        reply = "That's good to hear! " + reply
    return reply
