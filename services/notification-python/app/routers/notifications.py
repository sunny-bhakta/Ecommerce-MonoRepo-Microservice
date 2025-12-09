from dataclasses import dataclass
from typing import Literal

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr, HttpUrl


router = APIRouter()


class NotificationPayload(BaseModel):
    channel: Literal["email", "sms", "webpush"]
    to: EmailStr | str
    title: str | None = None
    body: str
    metadata: dict | None = None


class WebPushRegistration(BaseModel):
    endpoint: HttpUrl
    p256dh: str
    auth: str


@dataclass
class NotificationSettings:
    rabbitmq_url: str
    email_provider_url: str
    sms_provider_url: str


def get_settings(request: Request) -> NotificationSettings:
    return request.app.state.settings


@router.get("/health")
async def health(settings: NotificationSettings = Depends(get_settings)):
    return {"service": "notification", "status": "ok", "rabbitmq": settings.rabbitmq_url}


@router.post("/")
async def send_notification(
    payload: NotificationPayload,
    settings: NotificationSettings = Depends(get_settings),
):
    # Later we will publish to RabbitMQ; for now, echo payload for contract validation.
    return {
        "accepted": True,
        "channel": payload.channel,
        "target": payload.to,
        "metadata": payload.metadata or {},
        "provider_urls": {
            "email": settings.email_provider_url,
            "sms": settings.sms_provider_url,
        },
    }


@router.post("/webpush/register")
async def register_webpush(
    registration: WebPushRegistration,
):
    return {
        "accepted": True,
        "endpoint": registration.endpoint,
    }

