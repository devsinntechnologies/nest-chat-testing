import { useCallback, useEffect, useState } from "react";

type NotificationStatus = "default" | "denied" | "granted";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationStatus>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  useEffect(() => {
    if (!("Notification" in window)) return;

    const updatePermission = () => {
      setPermission(Notification.permission);
    };

    updatePermission();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  return {
    permission,
    requestPermission,
    isGranted: permission === "granted",
    isDenied: permission === "denied",
    isDefault: permission === "default",
  };
}
