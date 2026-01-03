import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, Copy, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/api-utils";

interface SharePanelProps {
  gameId: string;
  size?: number;
  showLabel?: boolean;
}

export const SharePanel = ({ gameId, size = 200, showLabel = true }: SharePanelProps) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const gameUrl = `${window.location.origin}/game/${gameId}`;

  useEffect(() => {
    const fetchQRCode = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${getApiUrl()}/api/games/${gameId}/qr`);
        const svgText = await response.text();
        setQrCode(svgText);
      } catch (error) {
        console.error("Failed to fetch QR code:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQRCode();
  }, [gameId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = gameUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      {showLabel && (
        <div className="text-center">
          <h3 className="text-lg font-semibold">Share Game</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Share this link or QR code with players
          </p>
        </div>
      )}

      {/* Game Link */}
      <div className="flex gap-2">
        <Input
          value={gameUrl}
          readOnly
          className="font-mono text-sm"
          onClick={(e) => e.currentTarget.select()}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>

      {copied && (
        <p className="text-xs text-green-500 text-center animate-in fade-in">
          Link copied to clipboard!
        </p>
      )}

      {/* QR Code */}
      <div className="flex justify-center p-4 bg-white rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ width: size, height: size }}>
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : qrCode ? (
          <div
            dangerouslySetInnerHTML={{ __html: qrCode }}
            style={{ width: size, height: size }}
          />
        ) : (
          <div className="flex items-center justify-center" style={{ width: size, height: size }}>
            <p className="text-sm text-muted-foreground">QR code unavailable</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Scan with phone camera to join
      </p>
    </Card>
  );
};
