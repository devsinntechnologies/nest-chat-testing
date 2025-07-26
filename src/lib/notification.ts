export function showIncomingCallNotification({
  title,
  body,
  icon,
  onClick,
}: {
  title: string;
  body: string;
  icon?: string;
  onClick?: () => void;
}) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon,
    });

    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };

    return notification;
  }
}
