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
  const soundUrl = '/incoming.mp3'
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon,
    });

     if (soundUrl) {
      const audio = new Audio(soundUrl);
      audio.loop = false;
      audio.play().catch((err) => console.error("Notification sound error:", err));
    }

    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };

    return notification;
  }
}
