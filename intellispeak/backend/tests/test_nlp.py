from app.services.nlp.analyzer import analyze_text


def test_positive_feedback():
    r = analyze_text("I am really happy with this application!")
    assert r["sentiment"]["label"] == "positive"
    assert r["emotion"]["label"] == "happy"
    assert r["intent"]["intent"] == "feedback"
    assert "application" in r["keywords"] and "happy" in r["keywords"]


def test_negation_flips_sentiment():
    assert analyze_text("This is not good")["sentiment"]["label"] == "negative"


def test_complaint_intent():
    assert analyze_text("The application is not responding.")["intent"]["intent"] == "complaint"


def test_greeting_and_stats():
    r = analyze_text("Hello")
    assert r["intent"]["intent"] == "greeting"
    assert r["statistics"]["word_count"] == 1


def test_dates_and_times():
    labels = {(e["text"], e["label"]) for e in analyze_text("We meet Monday at 5 pm")["entities"]}
    assert ("Monday", "DATE") in labels and ("5 pm", "TIME") in labels
