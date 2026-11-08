import { DesktopGate } from "../_components/desktop-gate";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return <DesktopGate>{children}</DesktopGate>;
}
