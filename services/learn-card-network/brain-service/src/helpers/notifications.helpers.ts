interface IPushNotificationRequest {
    to: string;
    title: string;
    message?: string;
}

interface IPushRegistrationRequest {
    profileId: string;
    deviceToken: string;
}

export async function SendPushNotification(args: IPushNotificationRequest) {
    try {
        if (process.env.WEBHOOK_URL) {
            const response = await fetch(process.env.WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(args),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        console.log(error);
    }
}

export async function RegisterDeviceForPushNotifications(args: IPushRegistrationRequest) {
    try {
        if (process.env.WEBHOOK_URL) {
            const response = await fetch(process.env.WEBHOOK_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
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
        if (process.env.WEBHOOK_URL) {
            const response = await fetch(process.env.WEBHOOK_URL, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
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
