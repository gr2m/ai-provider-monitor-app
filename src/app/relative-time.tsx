"use client";

import { useEffect, useState } from "react";

function getRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  return `${diffDay}d ago`;
}

export function RelativeTime({ dateTime }: { dateTime: string }) {
  const [relative, setRelative] = useState(() => getRelativeTime(dateTime));

  useEffect(() => {
    // Update immediately when dateTime changes, then refresh every minute
    const update = () => setRelative(getRelativeTime(dateTime));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [dateTime]);

  const utcString = new Date(dateTime).toUTCString();

  return (
    <time dateTime={dateTime} title={utcString}>
      {relative}
    </time>
  );
}
