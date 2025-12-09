from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr, HttpUrl
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..providers.twilio_provider import TwilioProvider
from ..providers.sendgrid_provider import SendgridProvider


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
    twilio_account_sid: str | None
    twilio_auth_token: str | None
    twilio_from_number: str | None
    sendgrid_api_key: str | None
    sendgrid_from_email: str | None
    mongo_url: str


def get_settings(request: Request) -> NotificationSettings:
    return request.app.state.settings


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.mongo_db


def get_twilio_provider(request: Request):
    return request.app.state.twilio_provider


def get_sendgrid_provider(request: Request):
    return request.app.state.sendgrid_provider


@router.get("/health")
async def health(settings: NotificationSettings = Depends(get_settings)):
    return {
        "service": "notification",
        "status": "ok",
        "rabbitmq": settings.rabbitmq_url,
        "mongo": settings.mongo_url,
        "twilio_configured": bool(
            settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number
        ),
        "sendgrid_configured": bool(settings.sendgrid_api_key and settings.sendgrid_from_email),
    }


@router.post("/")
async def send_notification(
    payload: NotificationPayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    settings: NotificationSettings = Depends(get_settings),
    twilio_provider: TwilioProvider = Depends(get_twilio_provider),
    sendgrid_provider: SendgridProvider = Depends(get_sendgrid_provider),
):
    doc = {
        "channel": payload.channel,
        "to": str(payload.to),
        "title": payload.title,
        "body": payload.body,
        "metadata": payload.metadata or {},
        "createdAt": datetime.utcnow(),
    }
    result = await db.notifications.insert_one(doc)

    provider_response_sms = None
    provider_response_email = None
    if payload.channel == "sms":
        provider_response_sms = await twilio_provider.send_sms(str(payload.to), payload.body)
    elif payload.channel == "email":
        provider_response_email = await sendgrid_provider.send_email(str(payload.to), payload.title, payload.body)
    else:
        provider_response_sms = {"sent": False, "reason": "not routed to provider"}
        provider_response_email = {"sent": False, "reason": "not routed to provider"}

    return {
        "accepted": True,
        "id": str(result.inserted_id),
        "channel": payload.channel,
        "target": payload.to,
        "metadata": payload.metadata or {},
        "provider_urls": {
            "email": settings.email_provider_url,
            "sms": settings.sms_provider_url,
        },
        "twilio": {
            "configured": bool(settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number),
            "response": provider_response_sms,
        },
        "sendgrid": {
            "configured": bool(settings.sendgrid_api_key and settings.sendgrid_from_email),
            "response": provider_response_email,
        },
    }


@router.post("/webpush/register")
async def register_webpush(
    registration: WebPushRegistration,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    await db.webpush_registrations.update_one(
        {"endpoint": registration.endpoint},
        {"$set": {"p256dh": registration.p256dh, "auth": registration.auth, "updatedAt": datetime.utcnow()}},
        upsert=True,
    )
    return {
        "accepted": True,
        "endpoint": registration.endpoint,
    }

