import { redirect } from "next/navigation";

import { startGoogleSignIn } from "@/modules/identity";

export async function GET() {
    const url = await startGoogleSignIn();
    redirect(url ? url.toString() : "/entrar?erro=google");
}
