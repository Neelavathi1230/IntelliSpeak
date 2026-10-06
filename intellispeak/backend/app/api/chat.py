from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.core.errors import AppError
from app.database.session import get_db
from app.models import AnalysisResult, Conversation, Message, User, utcnow
from app.schemas import ConversationCreate, ConversationOut, ConversationRename, MessageIn, ok
from app.services.chatbot.responder import generate_reply
from app.services.nlp.analyzer import analyze_text

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _owned(db: Session, user: User, conversation_id: int) -> Conversation:
    conv = db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user.id:
        raise AppError("NOT_FOUND", "Conversation not found.", 404)
    return conv


def _message_out(m: Message) -> dict:
    a = m.analysis
    return {
        "id": m.id,
        "conversation_id": m.conversation_id,
        "sender": m.sender,
        "content": m.content,
        "input_type": m.input_type,
        "created_at": m.created_at.isoformat(),
        "analysis": None
        if not a
        else {
            "sentiment": {"label": a.sentiment, "score": a.sentiment_score},
            "intent": {"intent": a.intent, "confidence": a.intent_confidence},
            "emotion": {"label": a.emotion},
            "keywords": a.keywords,
            "entities": a.entities,
            "statistics": {
                "word_count": a.word_count,
                "character_count": a.character_count,
                "sentence_count": a.sentence_count,
            },
        },
    }


@router.get("/conversations")
def list_conversations(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = db.scalars(
        select(Conversation).where(Conversation.user_id == user.id).order_by(Conversation.updated_at.desc())
    ).all()
    return ok([ConversationOut.model_validate(c) for c in rows])


@router.post("/conversations", status_code=201)
def create_conversation(
    body: ConversationCreate, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    conv = Conversation(user_id=user.id, title=(body.title or "New conversation").strip())
    db.add(conv)
    db.commit()
    return ok(ConversationOut.model_validate(conv), "Conversation created")


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    conv = _owned(db, user, conversation_id)
    return ok(
        {"conversation": ConversationOut.model_validate(conv), "messages": [_message_out(m) for m in conv.messages]}
    )


@router.patch("/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: int, body: ConversationRename, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    conv = _owned(db, user, conversation_id)
    conv.title = body.title.strip()
    db.commit()
    return ok(ConversationOut.model_validate(conv), "Conversation renamed")


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.delete(_owned(db, user, conversation_id))
    db.commit()
    return ok(None, "Conversation deleted")


@router.post("/message")
def send_message(body: MessageIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    text = body.text.strip()
    if not text:
        raise AppError("INVALID_INPUT", "Please provide a message.", 422)

    if body.conversation_id:
        conv = _owned(db, user, body.conversation_id)
    else:
        conv = Conversation(user_id=user.id, title=text[:40])
        db.add(conv)
        db.flush()
    if conv.title == "New conversation":
        conv.title = text[:40]

    analysis = analyze_text(text)
    user_msg = Message(conversation_id=conv.id, sender="user", content=text, input_type=body.input_type)
    user_msg.analysis = AnalysisResult(
        sentiment=analysis["sentiment"]["label"],
        sentiment_score=analysis["sentiment"]["score"],
        intent=analysis["intent"]["intent"],
        intent_confidence=analysis["intent"]["confidence"],
        emotion=analysis["emotion"]["label"],
        keywords=analysis["keywords"],
        entities=analysis["entities"],
        word_count=analysis["statistics"]["word_count"],
        character_count=analysis["statistics"]["character_count"],
        sentence_count=analysis["statistics"]["sentence_count"],
    )
    bot_msg = Message(conversation_id=conv.id, sender="bot", content=generate_reply(analysis), input_type="text")
    db.add(user_msg)
    db.flush()
    db.add(bot_msg)
    conv.updated_at = utcnow()
    db.commit()
    return ok(
        {
            "conversation": ConversationOut.model_validate(conv),
            "user_message": _message_out(user_msg),
            "bot_message": _message_out(bot_msg),
        },
        "Message processed",
    )
