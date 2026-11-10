import { DesktopGate } from "../_components/desktop-gate";

/**
 * Workout area. The page loads the open workout once and its screens (list and
 * set logging) then run on the client, so moving between exercises and logging
 * sets never wait for the server. This layout does no data work, so a prefetch
 * only takes it and the loading state, never workout data that could go stale.
 */
export default function WorkoutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return <DesktopGate>{children}</DesktopGate>;
}
