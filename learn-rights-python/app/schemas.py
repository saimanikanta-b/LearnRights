"""Pydantic schemas for request/response - match JS API."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SignupBody(BaseModel):
    name: str | None = None
    email: str | None = None
    mobile: str | None = None
    password: str | None = None
    preferredLanguage: str = "en"


class LoginBody(BaseModel):
    email: str | None = None
    mobile: str | None = None
    password: str | None = None


class CompleteSubtopicBody(BaseModel):
    userId: str
    moduleId: str
    subTopicId: str


class SubmitQuizBody(BaseModel):
    userId: str
    moduleId: str
    score: int
    totalQuestions: int


class UpdateProgressBody(BaseModel):
    userId: str
    moduleId: str | None = None
    quizScore: int | None = None
    pointsEarned: int | None = None
    badge: str | None = None


class UpdateProfileBody(BaseModel):
    name: str | None = None
    email: str | None = None
    mobile: str | None = None
    preferredLanguage: str | None = None
    showOnLeaderboard: bool | None = None
    emailNotifications: bool | None = None


class AIChatbotBody(BaseModel):
    message: str
    context: str | None = None
    # Optional conversation history from client (most recent messages)
    # Each item: {"sender": "user"|"bot", "text": "..."}
    history: list[dict[str, Any]] | None = None
    # Optional image: base64-encoded data (no data URL prefix)
    imageBase64: str | None = None
    imageMimeType: str | None = None  # e.g. image/jpeg, image/png


class AIQuizBody(BaseModel):
    moduleId: str
    userProgress: dict[str, Any] = Field(default_factory=dict)
