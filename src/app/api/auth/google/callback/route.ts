import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createSession, finishGoogleSignIn } from "@/modules/identity";
import { ensurePersonalWorkspace } from "@/modules/tenancy";

export async function GET(request: NextRequest) {
    const result = await finishGoogleSignIn(request.nextUrl.searchParams);
    if (!result.ok) {
        redirect(`/entrar?erro=${result.reason === "denied" ? "acesso" : "google"}`);
    }
    // The program is chosen in the onboarding (/comecar), not created here.
    await ensurePersonalWorkspace(result.user);
    await createSession(result.user.id);
    redirect("/");
}
