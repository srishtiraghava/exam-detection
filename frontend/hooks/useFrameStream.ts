"use client";

import { RefObject, useEffect, useRef } from "react";

import { framesWsUrl } from "@/lib/api";

export function useFrameStream(
  sessionId: string,
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let timer: number | null = null;
    const socket = new WebSocket(framesWsUrl(sessionId));
    socket.binaryType = "arraybuffer";
    socketRef.current = socket;

    const sendFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || socket.readyState !== WebSocket.OPEN || !context) {
        return;
      }
      canvas.width = 320;
      canvas.height = 240;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob && socket.readyState === WebSocket.OPEN) {
            blob.arrayBuffer().then((buffer) => socket.send(buffer)).catch(() => undefined);
          }
        },
        "image/jpeg",
        0.6,
      );
    };

    socket.addEventListener("open", () => {
      timer = window.setInterval(sendFrame, 250);
    });

    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, sessionId, videoRef]);
}
