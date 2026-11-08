/*
 * Shared plumbing for the action components: with `href` they render a Next.js
 * link, without it a <button> (type "button" unless told otherwise). Not a
 * component of the design system on its own.
 */
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type LinkActionProps = {
    href: string;
    children?: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;

type ButtonActionProps = {
    href?: undefined;
    children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export type ActionElementProps = LinkActionProps | ButtonActionProps;

export function ActionElement({ className, ...props }: ActionElementProps & { className: string }) {
    if (props.href !== undefined) {
        const { href, ...rest } = props;
        return <Link href={href} className={className} {...rest} />;
    }
    const { type = "button", ...rest } = props;
    return <button type={type} className={className} {...rest} />;
}
