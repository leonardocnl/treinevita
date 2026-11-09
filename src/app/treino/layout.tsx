import { DesktopGate } from "../_components/desktop-gate";

/**
 * Workout area. The page loads the open workout once and its screens (list and
 * exercise focus) then run on the client, so moving between exercises and logging
 * sets never wait for the server. On desktop the exercise list stays on the left
 * and the exercise in focus on the right; on the phone each one is a full screen.
 * This layout does no data work, so a prefetch only takes it and the skeleton
 * (loading.tsx), never workout data that could go stale.
 */
export default function WorkoutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <DesktopGate>
            <div className="mx-auto w-full max-w-6xl md:grid md:grid-cols-[minmax(300px,360px)_1fr] md:gap-14 md:px-10">
                {children}
            </div>
        </DesktopGate>
    );
}
