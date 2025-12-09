from contextlib import asynccontextmanager
from typing import AsyncIterator
import os

import aio_pika
from dotenv import load_dotenv
from fastapi import FastAPI

from .routers import notifications
from .routers.notifications import NotificationSettings


load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    connection = await aio_pika.connect_robust(
        app.state.settings.rabbitmq_url, client_properties={"connection_name": "notification-service"}
    )
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)

    app.state.rabbit_connection = connection
    app.state.rabbit_channel = channel

    yield

    await channel.close()
    await connection.close()


def create_app() -> FastAPI:
    settings = NotificationSettings(
        rabbitmq_url=os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672"),
        email_provider_url=os.getenv("EMAIL_PROVIDER_URL", "http://mailhog:8025"),
        sms_provider_url=os.getenv("SMS_PROVIDER_URL", "https://api.twilio.com"),
    )
    app = FastAPI(title="Notification Service", version="0.1.0", lifespan=lifespan)
    app.state.settings = settings
    app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
    return app


app = create_app()

