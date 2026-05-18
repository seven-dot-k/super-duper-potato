import type { NotificationAdapter } from "@/lib/shop-platform/adapters";

export const mockNotificationAdapter: NotificationAdapter = {
  async sendCartAbandonmentNotification({ cartId, channel, recipient, subject, body }) {
    return {
      notificationId: `NOTIFY-${cartId}-${channel}`.toUpperCase(),
      status: "sent",
      channel,
      recipient,
      subject,
      body,
      message: `Mock ${channel} notification sent for ${cartId}.`,
    };
  },
};
