import React, { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { Wifi, WifiOff } from "lucide-react";

export const ConnectionStatus = () => {
  const [status, setStatus] = useState<"connected" | "connecting" | "disconnected" | "failed">("connecting");
  const [showLabel, setShowLabel] = useState(true);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setStatus("connected");
      setShowLabel(true);
      // Hide label after 3 seconds when connected
      setTimeout(() => setShowLabel(false), 3000);
    };

    const handleDisconnect = () => {
      setStatus("disconnected");
      setShowLabel(true);
    };

    const handleReconnectAttempt = () => {
      setStatus("connecting");
      setShowLabel(true);
    };

    const handleReconnectFailed = () => {
      setStatus("failed");
      setShowLabel(true);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("reconnect_failed", handleReconnectFailed);

    // Set initial status
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("reconnect_failed", handleReconnectFailed);
    };
  }, []);

  // Don't show when connected and label is hidden
  if (status === "connected" && !showLabel) {
    return null;
  }

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500 animate-pulse";
      case "disconnected":
        return "bg-red-500 animate-pulse";
      case "failed":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected - Reconnecting...";
      case "failed":
        return "Connection failed - Refresh page";
      default:
        return "";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-card border rounded-lg shadow-lg">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      {showLabel && (
        <>
          {status === "connected" ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs font-medium">{getStatusText()}</span>
        </>
      )}
    </div>
  );
};
