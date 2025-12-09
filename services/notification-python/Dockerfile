FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV PYTHONUNBUFFERED=1
ENV RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
ENV EMAIL_PROVIDER_URL=http://mailhog:8025
ENV SMS_PROVIDER_URL=https://api.twilio.com

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]

