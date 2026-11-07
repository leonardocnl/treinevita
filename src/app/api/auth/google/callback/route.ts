import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createSession, finishGoogleSignIn } from "@/modules/identity";
import { ensurePersonalWorkspace } from "@/modules/tenancy";
import { createStarterProgram } from "@/modules/training";

export async function GET(request: NextRequest) {
    const result = await finishGoogleSignIn(request.nextUrl.searchParams);
    if (!result.ok) {
        redirect(`/entrar?erro=${result.reason === "denied" ? "acesso" : "google"}`);
    }
    await ensurePersonalWorkspace(result.user, createStarterProgram);
    await createSession(result.user.id);
    redirect("/");
}
