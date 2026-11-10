"use client";

import { useEffect } from "react";

/** Once per page load: asks the server to wake the database, without waiting for it. */
let sent = false;

export function WakeDatabase() {
    useEffect(() => {
        if (sent) {
            return;
        }
        sent = true;
        fetch("/api/wake", { cache: "no-store", keepalive: true }).catch(() => {});
    }, []);
    return null;
}
