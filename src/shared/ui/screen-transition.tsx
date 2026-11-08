/*
 * A screen that slides when the navigation that opens or leaves it carries a
 * direction: links tagged `transitionTypes={["nav-forward"]}` slide the content
 * to the left, `["nav-back"]` to the right (24px and a fade, see globals.css).
 * Navigations without a type (the browser's back button, tabs) do not slide.
 * Put it in each page, not in a layout: layouts persist, so they never enter or exit.
 */
import { ViewTransition, type ReactNode } from "react";

const DIRECTIONS = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

export function ScreenTransition({ children }: { children: ReactNode }) {
    return (
        <ViewTransition enter={DIRECTIONS} exit={DIRECTIONS} default="none">
            {children}
        </ViewTransition>
    );
}

export const NAV_FORWARD = ["nav-forward"];
export const NAV_BACK = ["nav-back"];
