import { describe, expect, it } from "vitest";

import { sanitizeSvg } from "./svg";

const wrap = (body: string) => `<svg viewBox="0 0 10 10" width="268pt">${body}</svg>`;

describe("sanitizeSvg", () => {
    it("keeps shapes and presentation attributes, sized by the viewBox", () => {
        expect(sanitizeSvg(wrap('<g fill="#333"><path d="M0 0h10v10z"/></g>'))).toBe(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g fill="#333"><path d="M0 0h10v10z"/></g></svg>',
        );
    });

    it("strips scripts with their content", () => {
        const output = sanitizeSvg(wrap('<script>alert(1)</script><path d="M0 0"/>'));
        expect(output).not.toMatch(/script|alert/);
        expect(output).toContain('<path d="M0 0"/>');
    });

    it("strips event handlers in any case and quoting", () => {
        const output = sanitizeSvg(
            '<svg onload="alert(1)" viewBox="0 0 1 1"><path ONCLICK=\'x()\' onmouseover=x d="M0 0"/></svg>',
        );
        expect(output).not.toMatch(/on\w+=|alert|x\(\)/i);
        expect(output).toContain('d="M0 0"');
    });

    it("drops foreignObject, style, links and external references", () => {
        const output = sanitizeSvg(
            wrap(
                '<foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><iframe src="https://evil"/></body></foreignObject>' +
                    "<style>path{fill:url(https://evil)}</style>" +
                    '<a href="javascript:alert(1)"><path d="M1 1"/></a>' +
                    '<use href="https://evil/x.svg#a"/><image href="https://evil/x.png"/>' +
                    '<path style="fill:url(#x)" fill="url(https://evil#a)" stroke="#000" d="M2 2"/>',
            ),
        );
        expect(output).not.toMatch(/foreignObject|iframe|style|href|url\(|evil|<a|<use|<image/);
        expect(output).toContain('<path stroke="#000" d="M2 2"/>');
        // Children of a dropped element are dropped with it.
        expect(output).not.toContain("M1 1");
    });

    it("drops comments, text, CDATA, doctypes and processing instructions", () => {
        const output = sanitizeSvg(
            '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x "y">]><!-- c --><svg viewBox="0 0 1 1">text<![CDATA[<script>]]><path d="M0 0"/></svg>',
        );
        expect(output).toBe(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0"/></svg>',
        );
    });

    it("ignores anything outside the root svg and closes unclosed tags", () => {
        expect(sanitizeSvg('<path d="M9 9"/><svg viewBox="0 0 1 1"><g>')).toBe(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><g></g></svg>',
        );
    });

    it("recolors to currentColor and removes the white background", () => {
        const output = sanitizeSvg(
            wrap('<g fill="#FFF"><path d="M0 0h10v10H0z"/></g><g fill="#333"><path d="M1 1"/></g>'),
            { recolor: true },
        );
        expect(output).toBe(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g fill="currentColor"><path d="M1 1"/></g></svg>',
        );
    });
});
