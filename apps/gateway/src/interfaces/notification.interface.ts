export interface NotificationAccepted {
  accepted: boolean;
  channel: string;
  target: string;
  metadata?: Record<string, unknown>;
  provider_urls?: Record<string, string>;
}