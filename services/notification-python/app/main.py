from contextlib import asynccontextmanager
from typing import AsyncIterator
import os

import aio_pika
import motor.motor_asyncio
from dotenv import load_dotenv
from fastapi import FastAPI

from .routers import notifications
from .routers.notifications import NotificationSettings
from .providers.twilio_provider import TwilioProvider
from .providers.sendgrid_provider import SendgridProvider


load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # RabbitMQ (optional for now)
    connection = await aio_pika.connect_robust(
        app.state.settings.rabbitmq_url, client_properties={"connection_name": "notification-service"}
    )
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)

    # Mongo client
    mongo_client = motor.motor_asyncio.AsyncIOMotorClient(app.state.settings.mongo_url)
    mongo_db = mongo_client.get_default_database() or mongo_client.get_database("ecommerce")

    app.state.rabbit_connection = connection
    app.state.rabbit_channel = channel
    app.state.mongo_client = mongo_client
    app.state.mongo_db = mongo_db

    yield

    await channel.close()
    await connection.close()
    mongo_client.close()


def create_app() -> FastAPI:
    settings = NotificationSettings(
        rabbitmq_url=os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672"),
        email_provider_url=os.getenv("EMAIL_PROVIDER_URL", "http://mailhog:8025"),
        sms_provider_url=os.getenv("SMS_PROVIDER_URL", "https://api.twilio.com"),
        twilio_account_sid=os.getenv("TWILIO_ACCOUNT_SID"),
        twilio_auth_token=os.getenv("TWILIO_AUTH_TOKEN"),
        twilio_from_number=os.getenv("TWILIO_FROM_NUMBER"),
        sendgrid_api_key=os.getenv("SENDGRID_API_KEY"),
        sendgrid_from_email=os.getenv("SENDGRID_FROM_EMAIL"),
        mongo_url=os.getenv("MONGO_URL", "mongodb://localhost:27017/ecommerce"),
    )
    app = FastAPI(title="Notification Service", version="0.1.0", lifespan=lifespan)
    app.state.settings = settings
    app.state.twilio_provider = TwilioProvider(
        settings.twilio_account_sid,
        settings.twilio_auth_token,
        settings.twilio_from_number,
    )
    app.state.sendgrid_provider = SendgridProvider(
        settings.sendgrid_api_key,
        settings.sendgrid_from_email,
    )
    app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
    return app


app = create_app()

