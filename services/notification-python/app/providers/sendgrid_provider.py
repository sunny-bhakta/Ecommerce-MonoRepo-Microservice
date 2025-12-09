import httpx


class SendgridProvider:
    def __init__(self, api_key: str | None, from_email: str | None):
        self.api_key = api_key or ""
        self.from_email = from_email or ""

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.from_email)

    async def send_email(self, to: str, subject: str | None, body: str) -> dict:
        if not self.is_configured:
            return {"sent": False, "reason": "sendgrid not configured"}

        payload = {
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": self.from_email},
            "subject": subject or "Notification",
            "content": [{"type": "text/plain", "value": body}],
        }

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post("https://api.sendgrid.com/v3/mail/send", json=payload, headers=headers)

        if response.status_code in (200, 202):
            return {"sent": True, "status_code": response.status_code}

        return {"sent": False, "status_code": response.status_code, "reason": response.text}


