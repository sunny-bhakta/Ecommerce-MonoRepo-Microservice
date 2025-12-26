import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class NotificationPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationPublisher.name);
  private connection?: amqp.Connection;
  private channel?: amqp.Channel;
  private readonly exchange = process.env.NOTIFICATION_EXCHANGE ?? 'notifications';

  async publishOrderCreated(payload: Record<string, unknown>): Promise<void> {
    const channel = await this.getChannel();
    await channel.assertExchange(this.exchange, 'topic', { durable: true });
    channel.publish(
      this.exchange,
      'order.created',
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  }

  private async getChannel(): Promise<amqp.Channel> {
    if (this.channel) {
      return this.channel;
    }

    const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    return this.channel;
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch((err) => this.logger.warn(err.message));
    await this.connection?.close().catch((err) => this.logger.warn(err.message));
  }
}