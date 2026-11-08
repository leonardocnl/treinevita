import { GlassIconButton } from "@/shared/ui/glass-icon-button";
import { Icon } from "@/shared/ui/icons";

/** The round glass button at the top right of the home screen that opens Ajustes. */
export function SettingsButton() {
    return (
        <GlassIconButton href="/ajustes" aria-label="Ajustes">
            <Icon name="settings" size={20} />
        </GlassIconButton>
    );
}
