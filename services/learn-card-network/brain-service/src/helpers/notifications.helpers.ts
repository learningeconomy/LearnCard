interface IPushNotificationRequest {
  to: string;
  title: string;
  message?: string;
  url?: string;
  actionType: string;
}

interface IPushRegistrationRequest {
  profileId: string;
  deviceToken: string;
}

export async function SendPushNotification(args: IPushNotificationRequest) {
  try {
    if (process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL) {
      const response = await fetch(process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': `${process.env.NOTIFICATIONS_SERVICE_API_KEY}`,
        },
        body: JSON.stringify({
          actionType: args.actionType,
          profileId: args.to,
          data: {
            title: args.title,
            message: args.message,
            url: args.url,
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Notifications Helpers - Error While Sending:', error);
  }
}

export async function RegisterDeviceForPushNotifications(args: IPushRegistrationRequest) {
  try {
    if (
      process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL &&
      process.env.NOTIFICATIONS_SERVICE_API_KEY
    ) {
      const response = await fetch(process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': `${process.env.NOTIFICATIONS_SERVICE_API_KEY}`,
        },
        body: JSON.stringify(args),
      });
      if (!response.ok) {
        // throw new Error(`HTTP error! status: ${response.status}`);
        console.log('http error', response.status);
        return null;
      }

      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

export async function UnregisterDeviceForPushNotifications(args: IPushRegistrationRequest) {
  try {
    if (
      process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL &&
      process.env.NOTIFICATIONS_SERVICE_API_KEY
    ) {
      const response = await fetch(process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': `${process.env.NOTIFICATIONS_SERVICE_API_KEY}`,
        },
        body: JSON.stringify(args),
      });
      if (!response.ok) {
        // throw new Error(`HTTP error! status: ${response.status}`);
        console.error('Notifications Helpers - Send Push Notification:', error);
        return null;
      }

      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}
