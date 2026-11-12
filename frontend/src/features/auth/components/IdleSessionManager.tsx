import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

import { authKeys, useLogout } from "../hooks";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
] as const;
const STORAGE_KEY = "nexus:last-activity";
const STORAGE_WRITE_INTERVAL_MS = 5_000;
const KEEPALIVE_INTERVAL_MS = 5 * 60_000;
const CHECK_INTERVAL_MS = 1_000;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

type IdleSessionManagerProps = {
  timeoutSeconds: number;
  warningSeconds: number;
};

export function IdleSessionManager({
  timeoutSeconds,
  warningSeconds,
}: IdleSessionManagerProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutate: logOut } = useLogout();

  const lastActivity = useRef(Date.now());
  const lastKeepAlive = useRef(Date.now());
  const lastStorageWrite = useRef(0);
  const isLoggingOut = useRef(false);
  // null: no warning displayed; otherwise, seconds before logout.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const isWarning = secondsLeft !== null;

  const keepServerSessionAlive = useCallback(() => {
    lastKeepAlive.current = Date.now();
    // Any request pushes the server-side expiry back (sliding session).
    void queryClient.invalidateQueries({ queryKey: authKeys.session });
  }, [queryClient]);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivity.current = now;
    if (now - lastStorageWrite.current > STORAGE_WRITE_INTERVAL_MS) {
      lastStorageWrite.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(now)); // shared with other tabs
      } catch {
        // Storage blocked: the tabs simply won't share their activity.
      }
    }
    if (now - lastKeepAlive.current > KEEPALIVE_INTERVAL_MS) {
      keepServerSessionAlive();
    }
  }, [keepServerSessionAlive]);

  const logOutForInactivity = useCallback(() => {
    logOut("inactivity", {
      onError: () => {
        // Offline: the server session expires on its own anyway.
        // Still hide the user's data from the screen.
        queryClient.clear();
        void navigate("/connexion", {
          replace: true,
          state: { reason: "inactivity" },
        });
      },
    });
  }, [logOut, queryClient, navigate]);

  // User activity in this tab (ignored while the warning is open:
  // only an explicit choice closes it).
  useEffect(() => {
    if (isWarning) {
      return;
    }
    const handleActivity = () => {
      recordActivity();
    };
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [isWarning, recordActivity]);

  // Activity in another tab counts too.
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY && event.newValue) {
        lastActivity.current = Math.max(
          lastActivity.current,
          Number(event.newValue),
        );
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Compares the real time with the last activity (survives computer sleep).
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (isLoggingOut.current) {
        return;
      }
      const remainingMs =
        timeoutSeconds * 1000 - (Date.now() - lastActivity.current);
      if (remainingMs <= 0) {
        isLoggingOut.current = true;
        logOutForInactivity();
      } else if (remainingMs <= warningSeconds * 1000) {
        setSecondsLeft(Math.ceil(remainingMs / 1000));
      } else {
        setSecondsLeft(null); // e.g. activity in another tab
      }
    }, CHECK_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [timeoutSeconds, warningSeconds, logOutForInactivity]);

  function stayConnected() {
    lastStorageWrite.current = 0; // share this choice with the other tabs now
    recordActivity();
    keepServerSessionAlive();
    setSecondsLeft(null);
  }

  const warningMinutes = Math.round(warningSeconds / 60);

  return (
    <Modal
      open={isWarning}
      onClose={stayConnected}
      closeOnBackdropClick={false}
      title="Es-tu toujours là ?"
      description={`Pour protéger ton compte, tu seras déconnecté dans ${warningMinutes} minutes sans activité.`}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              isLoggingOut.current = true;
              logOut("logout");
            }}
          >
            Se déconnecter
          </Button>
          <Button onClick={stayConnected}>Rester connecté</Button>
        </>
      }
    >
      {secondsLeft !== null && (
        <p className="text-3xl font-extrabold tabular-nums">
          <span className="sr-only">Temps restant : </span>
          {formatCountdown(secondsLeft)}
        </p>
      )}
    </Modal>
  );
}
