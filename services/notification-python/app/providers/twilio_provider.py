import httpx


class TwilioProvider:
    def __init__(self, account_sid: str | None, auth_token: str | None, from_number: str | None):
        self.account_sid = account_sid or ""
        self.auth_token = auth_token or ""
        self.from_number = from_number or ""

    @property
    def is_configured(self) -> bool:
        return bool(self.account_sid and self.auth_token and self.from_number)

    async def send_sms(self, to: str, body: str) -> dict:
        if not self.is_configured:
            return {"sent": False, "reason": "twilio not configured"}

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        data = {"From": self.from_number, "To": to, "Body": body}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, data=data, auth=(self.account_sid, self.auth_token))

        if response.is_success:
            payload = response.json()
            return {
                "sent": True,
                "sid": payload.get("sid"),
                "status": payload.get("status"),
            }

        return {"sent": False, "status_code": response.status_code, "reason": response.text}


