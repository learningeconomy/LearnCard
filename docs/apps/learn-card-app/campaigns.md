# Manage campaigns

Authorized administrators can open `/admin/campaigns` directly in LearnCard App to create, preview, and manage campaigns.

## Choose an audience

Open a saved campaign. Under **Audience**, search for a member by name or username, select the matching profile, then choose **Add selected members**. Selecting a search result alone does not add it. Search follows the network's profile visibility and blocking rules.

You can also choose an audience source and enter email addresses or account identifiers using **Fields**, or edit its **JSON**. Email matching finds existing verified accounts; it does not send email or invite new members. **Preview** checks source matches without adding them.

## Send audience notifications

1. Enable **Inbox / push notification**, enter the notification title and body, and save.
2. Add the intended audience. **View stored members** confirms who is enrolled.
3. Choose **Go Live** and ensure the current time is within the campaign's schedule.
4. Choose **Send Notifications** to review the number of eligible recipients.
5. Choose **Confirm notification send** to start delivery, or **Cancel** to close the review.

Sending targets the campaign's entire eligible stored audience, not just the selected search results. The review excludes previously notified members and people who do not meet the campaign's age policy. If the campaign or eligible recipients change before confirmation, review the count again.

Delivery creates inbox notifications and attempts push through the existing notification system. Eligibility is checked again during delivery, so the reviewed count is a snapshot, not a guarantee of final delivery. The **Notified (inbox)** statistic records inbox storage acknowledgements, not device receipt. Stats refresh every 30 seconds while the page is active.

If no eligible recipients remain, confirmation is disabled. Check the stored audience, eligibility, prior notifications, and schedule. After a connection error, refresh and review again before retrying: the previous request may have completed.

## Test before sending

**Send Test to Me** targets the signed-in administrator and supports saved drafts without an audience. It uses the selected channels: an in-app test appears on the next app visit outside the editor; an inbox/push test uses notification delivery. Tests do not change audience membership or campaign engagement statistics.

Campaign inbox notifications show the saved notification title and body, an announcement icon, their sent time, and an unread indicator. Recipients can mark them as read, archive them, or restore them from Archived. Existing campaign notifications use this display too; there is no need to resend them.
