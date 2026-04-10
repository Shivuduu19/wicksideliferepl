"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
// MorphSVGPlugin is optional (Club GreenSock). If you have it, register it:
// import MorphSVGPlugin from "gsap/MorphSVGPlugin";
// gsap.registerPlugin(MorphSVGPlugin);

type PathConfigMap = {
    [key: string]: string | string[];
};

type Options = {
    rotationLimit?: number;
    rotationSpeed?: number;
    resetSpeed?: number;
    transitionDuration?: number;
    transitionInDelay?: number;
    movementThreshold?: number;
    movementTimeout?: number;
    movementDelay?: number;
    morphDuration?: number;
    morphEase?: string;
    defaultText?: string;
    excludeSelectors?: string[];
    morphTextEffect?: boolean;
    debug?: boolean;
    sequenceDuration?: number;
    interactiveSelectors?: string[];
    pathConfigs?: PathConfigMap;
};

const DEFAULT_INTERACTIVE_SELECTORS = ["a", "button", "[data-cursor]", "iframe"];

const Cursor = ({
    options: userOptions = {},
}: {
    options?: Options;
}) => {
    const opts = {
        rotationLimit: 45,
        rotationSpeed: 0.1,
        resetSpeed: 0.2,
        transitionDuration: 0.2,
        transitionInDelay: 0.2,
        movementThreshold: 8,
        movementTimeout: 100,
        movementDelay: 150,
        morphDuration: 0.3,
        morphEase: "power2.out",
        defaultText: "MORE",
        excludeSelectors: [] as string[],
        morphTextEffect: true,
        debug: false,
        sequenceDuration: 1000,
        interactiveSelectors: DEFAULT_INTERACTIVE_SELECTORS,
        pathConfigs: {
            default: "M72 61.143 49 48l5.75 24L72 61.143Z",
            custom: ["M72 61.143 49 48l5.75 24L72 61.143Z"],
        },
        ...userOptions,
    } as Required<Options>;

    // refs for DOM nodes
    const rootRef = useRef<HTMLDivElement | null>(null);
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const cursorInnerRef = useRef<HTMLDivElement | null>(null);
    const cursorPathRef = useRef<SVGPathElement | null>(null);
    const cursorSvgRef = useRef<SVGSVGElement | null>(null);

    // mutable state via refs (avoids re-renders)
    const stateRef = useRef({
        currentRotation: 0,
        targetRotation: 0,
        lastX: 0,
        lastY: 0,
        lastTime: typeof performance !== "undefined" ? performance.now() : Date.now(),
        isInitialized: false,
        isVisible: false,
        hasMouseMoved: false,
        isMoving: false,
        movementTimeoutId: null as number | null,
        movementDelayId: null as number | null,
        totalMovement: 0,
        lastMovementTime: 0,
        interactiveSelectors: opts.interactiveSelectors,
        currentMorphType: "default" as string,
        currentMorphIndex: 0,
        isMorphing: false,
        hoveredElement: null as Element | null,
        pendingHoverElement: null as Element | null,
        sequenceInterval: null as number | null,
        leaveTimeout: null as number | null,
        motionPreferenceMediaQuery: null as MediaQueryList | null,
    });

    // helpers
    const log = (msg: string, data?: any) => {
        if (opts.debug) {
            // eslint-disable-next-line no-console
            console.log("[Cursor]", msg, data ?? "");
        }
    };

    // utility: check reduced motion
    const prefersReducedMotion = () => {
        try {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        } catch {
            return false;
        }
    };

    // should enable cursor
    const shouldEnableCursor = () => !prefersReducedMotion();

    // requestAnimationFrame loop for rotation smoothing
    const rafRef = useRef<number | null>(null);
    function animateRotation() {
        const st = stateRef.current;
        if (!st.isInitialized) return;
        st.currentRotation += (st.targetRotation - st.currentRotation) * opts.rotationSpeed;
        st.targetRotation += (0 - st.targetRotation) * opts.resetSpeed;
        if (cursorSvgRef.current) {
            cursorSvgRef.current.style.transform = `rotate(${st.currentRotation}deg)`;
        }
        rafRef.current = requestAnimationFrame(animateRotation);
    }

    // movement state setter
    function setMovementState(value: boolean) {
        const st = stateRef.current;
        if (st.isMoving === value) return;
        st.isMoving = value;

        if (st.movementTimeoutId) {
            window.clearTimeout(st.movementTimeoutId);
            st.movementTimeoutId = null;
        }
        if (st.movementDelayId) {
            window.clearTimeout(st.movementDelayId);
            st.movementDelayId = null;
        }

        if (cursorRef.current) {
            if (value) {
                cursorRef.current.classList.add("is-moving");
            } else {
                // delay removal
                st.movementDelayId = window.setTimeout(() => {
                    cursorRef.current && cursorRef.current.classList.remove("is-moving");
                }, opts.movementDelay);
            }
        }

        if (value) {
            st.movementTimeoutId = window.setTimeout(() => {
                setMovementState(false);
            }, opts.movementTimeout);
        }
    }

    // show/hide
    function show() {
        if (!cursorInnerRef.current || !cursorRef.current) return;
        stateRef.current.isVisible = true;
        cursorRef.current.style.opacity = "1";
        cursorRef.current.style.visibility = "visible";
        cursorInnerRef.current.style.opacity = "1";
        cursorInnerRef.current.style.transform = "scale(1)";
    }
    function hide() {
        if (!cursorInnerRef.current || !cursorRef.current) return;
        stateRef.current.isVisible = false;
        cursorRef.current.style.opacity = "0";
        cursorInnerRef.current.style.opacity = "0";
        cursorInnerRef.current.style.transform = "scale(0.6)";
    }
    function showWithDelay() {
        window.setTimeout(() => {
            show();
        }, opts.transitionInDelay * 1000);
    }

    // handle mouse move
    function handleMouseMove(e: MouseEvent) {
        if (!cursorRef.current) return;
        const st = stateRef.current;

        if (!st.hasMouseMoved) {
            st.hasMouseMoved = true;
            showWithDelay();
        }

        // maintain existing scale transform if any
        const scaleMatch = cursorRef.current.style.transform.match(/scale\([^)]+\)/);
        const scalePart = scaleMatch ? scaleMatch[0] : "scale(1)";
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) ${scalePart}`;

        const dx = Math.abs(e.clientX - st.lastX);
        const dy = Math.abs(e.clientY - st.lastY);
        const movement = dx + dy;
        st.totalMovement += movement;
        st.lastMovementTime = performance.now();
        if (movement > opts.movementThreshold) setMovementState(true);

        const now = performance.now();
        const delta = now - st.lastTime;
        if (delta > 0) {
            const v = (e.clientX - st.lastX) / delta;
            st.targetRotation = Math.max(Math.min(v * 100, opts.rotationLimit), -opts.rotationLimit);
        }

        st.lastX = e.clientX;
        st.lastY = e.clientY;
        st.lastTime = now;
    }

    // link click handling (internal links)
    function handleLinkClick(ev: MouseEvent) {
        const a = ev.currentTarget as HTMLAnchorElement;
        const href = a?.href;
        if (!href) return;
        const origin = window.location.origin;
        if (!href.startsWith(origin)) return;
        ev.preventDefault();
        hide();
        window.setTimeout(() => {
            window.location.href = href;
        }, opts.transitionDuration * 1000);
    }

    // hover handling
    function isExcludedFromMorphing(el: Element) {
        return opts.excludeSelectors.some((sel) => {
            try {
                return (el as Element).matches(sel) || (el as Element).closest(sel);
            } catch {
                return false;
            }
        });
    }

    function getCursorType(el: Element) {
        const has = el.hasAttribute("data-cursor");
        const val = el.getAttribute("data-cursor");
        log("Getting cursor type", {
            element: el.tagName,
            dataCursor: val,
            hasDataCursor: has,
        });
        if (has) {
            if (val === "hidden") {
                log("Returning default for hidden cursor");
                return "default";
            }
            log("Returning custom for data-cursor element");
            return "custom";
        }
        if (el.tagName === "A" || el.tagName === "BUTTON" || (el.closest && el.closest("a, button"))) {
            log("Returning custom for interactive element");
            return "custom";
        }
        log("Returning default");
        return "default";
    }

    // cursor text handling
    function handleCursorText(el: Element, on: boolean) {
        if (!opts.morphTextEffect || !cursorRef.current) return;
        const s = cursorRef.current.querySelector(".cursor_text") as HTMLElement | null;
        if (!s) return;
        if (on) {
            const text = (el.getAttribute("data-cursor-text") as string) || opts.defaultText;
            s.textContent = text;
            log("Set cursor text", { text, isDefault: !el.getAttribute("data-cursor-text") });
        } else {
            s.textContent = "";
            log("Cleared cursor text");
        }
    }

    // cursor class toggles per type
    function handleCursorTypeClass(el: Element, on: boolean) {
        if (!cursorRef.current) return;
        if (on) {
            const t = el.getAttribute("data-cursor");
            if (t && t !== "hidden") {
                cursorRef.current.classList.add(`cursor-type--${t}`);
                log("Added cursor type class", { type: t });
            }
        } else {
            const classes = Array.from(cursorRef.current.classList).filter((c) => c.startsWith("cursor-type--"));
            classes.forEach((cl) => cursorRef.current && cursorRef.current.classList.remove(cl));
            if (classes.length > 0) log("Removed cursor type classes", { classes });
        }
    }

    // morphing helpers (use GSAP morphSVG if available else fallback)
    function hasMorphPlugin() {
        // @ts-ignore
        return !!(gsap && (gsap as any).plugins && (gsap as any).plugins.morphSVG);
    }

    function morphPathTo(pathD: string, duration = opts.morphDuration) {
        if (!cursorPathRef.current) return;
        if (hasMorphPlugin()) {
            // @ts-ignore - morphSVG plugin type may not be available
            gsap.to(cursorPathRef.current, {
                duration,
                // @ts-ignore
                morphSVG: pathD,
                ease: opts.morphEase,
            });
        } else {
            // graceful fallback: set attribute directly (no tween)
            cursorPathRef.current.setAttribute("d", pathD);
        }
    }

    function morphToType(typeName: string) {
        if (!opts.morphTextEffect) {
            log("Morphing disabled");
            return;
        }
        if (!cursorPathRef.current || !opts.pathConfigs[typeName]) {
            log("Cannot morph - missing cursorPath or pathConfig", { hasPath: !!opts.pathConfigs[typeName] });
            return;
        }

        const configs = Array.isArray(opts.pathConfigs[typeName])
            ? (opts.pathConfigs[typeName] as string[])
            : [opts.pathConfigs[typeName] as string];
        const chosen = configs[stateRef.current.currentMorphIndex % configs.length];

        stateRef.current.isMorphing = true;
        stateRef.current.currentMorphType = typeName;
        morphPathTo(chosen);
        // onComplete handling - since fallback may be immediate, we do setTimeout to queue the post-morph logic:
        window.setTimeout(() => {
            stateRef.current.isMorphing = false;
            if (stateRef.current.pendingHoverElement) {
                const pending = stateRef.current.pendingHoverElement;
                stateRef.current.pendingHoverElement = null;
                const t = getCursorType(pending);
                stateRef.current.hoveredElement = pending;
                if (t && t !== "default") morphToType(t);
                else morphToDefault();
            } else if (!stateRef.current.hoveredElement && !isHoveringInteractiveElement()) {
                morphToDefault();
            }
        }, (opts.morphDuration + 0.02) * 1000);

        stateRef.current.currentMorphIndex = (stateRef.current.currentMorphIndex + 1) % configs.length;
    }

    function morphToDefault() {
        if (!opts.morphTextEffect) return;
        if (!cursorPathRef.current || !opts.pathConfigs.default) return;
        stateRef.current.isMorphing = true;
        morphPathTo(opts.pathConfigs.default as string);
        window.setTimeout(() => {
            stateRef.current.isMorphing = false;
        }, (opts.morphDuration + 0.02) * 1000);
        stateRef.current.currentMorphType = "default";
    }

    function startSequence(typeName: string) {
        if (!opts.morphTextEffect) return;
        if (!cursorPathRef.current || !opts.pathConfigs[typeName]) return;
        stopSequence();
        stateRef.current.currentMorphType = typeName;

        const configs = Array.isArray(opts.pathConfigs[typeName])
            ? (opts.pathConfigs[typeName] as string[])
            : [opts.pathConfigs[typeName] as string];

        const chosen = configs[stateRef.current.currentMorphIndex % configs.length];
        stateRef.current.isMorphing = true;
        morphPathTo(chosen);
        window.setTimeout(() => {
            stateRef.current.isMorphing = false;
            startSequenceInterval(typeName);
        }, opts.morphDuration * 1000 + 20);

        stateRef.current.currentMorphIndex = (stateRef.current.currentMorphIndex + 1) % configs.length;
    }

    function startSequenceInterval(typeName: string) {
        if (!opts.morphTextEffect) return;
        if (!cursorPathRef.current || !opts.pathConfigs[typeName]) return;
        stateRef.current.sequenceInterval = window.setInterval(() => {
            if (!stateRef.current.hoveredElement || stateRef.current.isMorphing) return;
            const configs = Array.isArray(opts.pathConfigs[typeName])
                ? (opts.pathConfigs[typeName] as string[])
                : [opts.pathConfigs[typeName] as string];
            const chosen = configs[stateRef.current.currentMorphIndex % configs.length];
            stateRef.current.isMorphing = true;
            morphPathTo(chosen);
            window.setTimeout(() => {
                stateRef.current.isMorphing = false;
            }, opts.morphDuration * 1000 + 20);
            stateRef.current.currentMorphIndex = (stateRef.current.currentMorphIndex + 1) % configs.length;
        }, opts.sequenceDuration);
    }

    function stopSequence() {
        if (stateRef.current.sequenceInterval) {
            window.clearInterval(stateRef.current.sequenceInterval);
            stateRef.current.sequenceInterval = null;
        }
        stateRef.current.isMorphing = false;
        stateRef.current.currentMorphType = "default";
    }

    function forceMorphToType(typeName: string) {
        if (!opts.morphTextEffect) return;
        if (!cursorPathRef.current || !opts.pathConfigs[typeName]) return;
        // kill tweens if plugin available
        try {
            // @ts-ignore
            if (hasMorphPlugin()) gsap.killTweensOf(cursorPathRef.current);
        } catch { }
        stateRef.current.isMorphing = false;
        stateRef.current.currentMorphType = typeName;
        const configs = Array.isArray(opts.pathConfigs[typeName])
            ? (opts.pathConfigs[typeName] as string[])
            : [opts.pathConfigs[typeName] as string];
        const chosen = configs[stateRef.current.currentMorphIndex % configs.length];
        morphPathTo(chosen);
        stateRef.current.currentMorphIndex = (stateRef.current.currentMorphIndex + 1) % configs.length;
    }

    // detect if hovering interactive element (closest :hover)
    function isHoveringInteractiveElement(): boolean {
        const hovered = document.querySelector(":hover") as Element | null;
        if (!hovered) return false;
        for (const sel of stateRef.current.interactiveSelectors) {
            try {
                if (hovered.matches(sel) || (hovered.closest && hovered.closest(sel))) {
                    log("Found hovering interactive element", { element: hovered.tagName, selector: sel });
                    return true;
                }
            } catch { }
        }
        log("No hovering interactive element found", { element: hovered.tagName });
        return false;
    }

    // hover handlers
    function handleElementHover(ev: Event) {
        const target = ev.currentTarget as Element;
        const t = getCursorType(target);
        log("Element hover", {
            element: `${target.tagName}${target.className ? "." + target.className : ""}`,
            cursorType: t,
            isMorphing: stateRef.current.isMorphing,
            currentHovered: stateRef.current.hoveredElement ? stateRef.current.hoveredElement.tagName : null,
        });

        if (stateRef.current.leaveTimeout) {
            window.clearTimeout(stateRef.current.leaveTimeout);
            stateRef.current.leaveTimeout = null;
            log("Cancelled pending leave timeout");
        }

        const excluded = isExcludedFromMorphing(target);
        if (excluded || (cursorRef.current && cursorRef.current.classList.add("is-active"), handleCursorText(target, true), handleCursorTypeClass(target, true)), stateRef.current.isMorphing) {
            log("Morphing in progress, queuing hover");
            stateRef.current.pendingHoverElement = target;
            if (t && t !== "default" && !excluded) {
                log("Force morphing to custom cursor during transition");
                forceMorphToType(t);
            }
            return;
        }

        if (t && t !== "default" && !excluded) {
            log("Starting sequence for custom type", { cursorType: t, isExcluded: excluded });
            stateRef.current.hoveredElement = target;
            stateRef.current.pendingHoverElement = null;
            startSequence(t);
        } else if (t === "default" && !excluded) {
            log("Morphing to default type", { isExcluded: excluded });
            stateRef.current.hoveredElement = target;
            stateRef.current.pendingHoverElement = null;
            morphToDefault();
        } else {
            log("Element excluded from morphing", { cursorType: t, isExcluded: excluded });
            stateRef.current.hoveredElement = target;
            stateRef.current.pendingHoverElement = null;
        }
    }

    function handleElementLeave(ev: Event) {
        const target = ev.currentTarget as Element;
        log("Element leave", {
            element: `${target.tagName}${target.className ? "." + target.className : ""}`,
            isMorphing: stateRef.current.isMorphing,
            hoveredElement: stateRef.current.hoveredElement ? stateRef.current.hoveredElement.tagName : null,
        });

        if (stateRef.current.leaveTimeout) {
            window.clearTimeout(stateRef.current.leaveTimeout);
            stateRef.current.leaveTimeout = null;
        }

        if (!isExcludedFromMorphing(target)) {
            handleCursorText(target, false);
            handleCursorTypeClass(target, false);
        }

        stateRef.current.leaveTimeout = window.setTimeout(() => {
            handleElementLeaveDelayed(target);
        }, 50);
    }

    function handleElementLeaveDelayed(el: Element) {
        log("Delayed element leave processing", {
            element: `${el.tagName}${el.className ? "." + el.className : ""}`,
            isMorphing: stateRef.current.isMorphing,
            hoveredElement: stateRef.current.hoveredElement ? stateRef.current.hoveredElement.tagName : null,
        });

        if (stateRef.current.hoveredElement === el) stateRef.current.hoveredElement = null;
        const t = isHoveringInteractiveElement();
        log("Still hovering interactive element", t);
        if (!t && cursorRef.current) {
            cursorRef.current.classList.remove("is-active");
            log("Removed is-active class");
        }
        if (t) {
            log("Still hovering interactive element, not reverting");
        } else {
            stopSequence();
            log("Reverting to default immediately");
            morphToDefault();
        }
    }

    // element / link setup (called on init and via mutation observer)
    function setupLinkHandling() {
        const selector = `a[href^="/"], a[href^="${window.location.origin}"]`;
        document.querySelectorAll(selector).forEach((a) => {
            a.addEventListener("click", handleLinkClick);
        });

        // mutation observer to bind click handlers on new nodes
        const mo = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                m.addedNodes.forEach((n) => {
                    if (n.nodeType !== 1) return;
                    const node = n as Element;
                    const anchors = node.querySelectorAll ? node.querySelectorAll(selector) : [];
                    anchors.forEach((a) => a.addEventListener("click", handleLinkClick));
                });
            });
        });
        mo.observe(document.body, { childList: true, subtree: true });
        return mo;
    }

    function setupMorphingHandling() {
        // attach hover handlers for interactive selectors
        const observers: MutationObserver[] = [];
        const boundEls: Element[] = [];
        const selectors = stateRef.current.interactiveSelectors;

        function attachTo(selector: string, root: ParentNode = document) {
            const els = Array.from(root.querySelectorAll(selector));
            els.forEach((el) => {
                el.addEventListener("mouseenter", handleElementHover);
                el.addEventListener("mouseleave", handleElementLeave);
                boundEls.push(el);
            });
        }

        selectors.forEach((sel) => attachTo(sel));

        // MutationObserver to attach to newly added interactive elements
        const mo = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                m.addedNodes.forEach((n) => {
                    if (n.nodeType !== 1) return;
                    const node = n as Element;
                    selectors.forEach((sel) => {
                        const matches = node.querySelectorAll ? node.querySelectorAll(sel) : [];
                        const arr = Array.from(matches);
                        if ((node as Element).matches && (node as Element).matches(sel)) arr.push(node);
                        arr.forEach((el) => {
                            el.addEventListener("mouseenter", handleElementHover);
                            el.addEventListener("mouseleave", handleElementLeave);
                            boundEls.push(el);
                        });
                    });
                });
            });
        });
        mo.observe(document.body, { childList: true, subtree: true });
        observers.push(mo);

        return { observers, boundEls };
    }

    // motion preference listener setup
    function setupMotionPreferenceListener() {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handler = (ev: MediaQueryListEvent) => {
            if (ev.matches) {
                log("User now prefers reduced motion, cleaning up custom cursor");
                cleanup();
            } else {
                log("User no longer prefers reduced motion, initializing custom cursor");
                init();
            }
        };
        mq.addEventListener("change", handler);
        stateRef.current.motionPreferenceMediaQuery = mq;
        return { mq, handler };
    }

    // init / cleanup
    function init() {
        if (!shouldEnableCursor()) {
            log("User prefers reduced motion, skipping custom cursor initialization");
            return;
        }

        const cursor = document.querySelector(".cursor") as HTMLDivElement | null;
        if (!cursor) {
            console.warn('Cursor element not found. Make sure you have an element with class "cursor"');
            return;
        }
        cursorRef.current = cursor;
        cursorInnerRef.current = cursor.querySelector(".cursor_inner") as HTMLDivElement | null;
        const innerElements = cursorInnerRef.current ? cursorInnerRef.current.querySelectorAll(".cursor_element") : null;
        if (!cursorInnerRef.current) {
            console.warn('No cursor inner wrapper found. Make sure you have an element with class "cursor_inner"');
            return;
        }
        if (!innerElements || innerElements.length === 0) {
            console.warn('No cursor inner elements found. Make sure you have elements with class "cursor_element"');
            // still continue, not fatal
        }

        cursorPathRef.current = cursor.querySelector(".cursor_path") as SVGPathElement | null;
        cursorSvgRef.current = cursor.querySelector(".cursor_element svg") as SVGSVGElement | null;

        if (!cursorPathRef.current) {
            console.warn('No cursor path found. Make sure you have an element with class "cursor_path"');
        }

        // events
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseenter", () => {
            stateRef.current.isVisible = true;
            if (cursorRef.current && cursorInnerRef.current) {
                cursorRef.current.style.opacity = "1";
                cursorInnerRef.current.style.opacity = "1";
                cursorInnerRef.current.style.transform = "scale(1)";
            }
        });
        document.addEventListener("mouseleave", () => {
            if (cursorInnerRef.current) {
                stateRef.current.isVisible = false;
                if (cursorRef.current) cursorRef.current.style.opacity = "0";
                cursorInnerRef.current.style.opacity = "0";
                cursorInnerRef.current.style.transform = "scale(0.6)";
            }
        });

        const linkMo = setupLinkHandling();
        const morph = setupMorphingHandling();
        const mp = setupMotionPreferenceListener();

        stateRef.current.isInitialized = true;
        // start rotation raf loop
        rafRef.current = requestAnimationFrame(animateRotation);

        // save observers for cleanup on stateRef (we'll store callbacks)
        (stateRef.current as any).__linkMo = linkMo;
        (stateRef.current as any).__morphData = morph;
        (stateRef.current as any).__motionData = mp;

        log("Cursor initialized");
    }

    function cleanup() {
        if (!stateRef.current.isInitialized) return;
        document.removeEventListener("mousemove", handleMouseMove);
        // remove link click handlers
        const linkData = (stateRef.current as any).__linkMo;
        if (linkData && linkData.disconnect) {
            linkData.disconnect();
        }
        // remove morph bindings
        const morphData = (stateRef.current as any).__morphData;
        if (morphData) {
            morphData.boundEls?.forEach((el: Element) => {
                el.removeEventListener("mouseenter", handleElementHover);
                el.removeEventListener("mouseleave", handleElementLeave);
            });
            morphData.observers?.forEach((o: MutationObserver) => o.disconnect());
        }
        // motion pref listener
        const mp = (stateRef.current as any).__motionData;
        if (mp && mp.mq && mp.handler) {
            try {
                mp.mq.removeEventListener("change", mp.handler);
            } catch { }
        }

        // remove internal handlers for anchors
        const selector = `a[href^="/"], a[href^="${window.location.origin}"]`;
        document.querySelectorAll(selector).forEach((a) => {
            (a as Element).removeEventListener("click", handleLinkClick);
        });

        // clear intervals/timeouts
        if (stateRef.current.sequenceInterval) {
            window.clearInterval(stateRef.current.sequenceInterval);
            stateRef.current.sequenceInterval = null;
        }
        if (stateRef.current.movementTimeoutId) {
            window.clearTimeout(stateRef.current.movementTimeoutId);
            stateRef.current.movementTimeoutId = null;
        }
        if (stateRef.current.movementDelayId) {
            window.clearTimeout(stateRef.current.movementDelayId);
            stateRef.current.movementDelayId = null;
        }
        if (stateRef.current.leaveTimeout) {
            window.clearTimeout(stateRef.current.leaveTimeout);
            stateRef.current.leaveTimeout = null;
        }

        // cancel raf
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        // cleanup classes + text
        if (cursorRef.current) {
            cursorRef.current.classList.remove("is-active");
            Array.from(cursorRef.current.classList).forEach((c) => {
                if (c.startsWith("cursor-type--")) cursorRef.current && cursorRef.current.classList.remove(c);
            });
        }
        const t = cursorRef.current?.querySelector(".cursor_text");
        if (t) (t as HTMLElement).textContent = "";

        stateRef.current.isInitialized = false;
        log("Cursor cleaned up");
    }

    // init on mount
    useEffect(() => {
        // mount component DOM root
        rootRef.current = document.querySelector(".cursor") as HTMLDivElement | null;
        // also set template refs if the markup is nested in this component
        if (!rootRef.current) {
            // if not found in document root, maybe our local cursor element appended below; try to get from local ref
            // (we will attach refs via JSX refs)
            rootRef.current = cursorRef.current;
        }

        // ensure we have local DOM nodes if component provides them:
        if (!cursorRef.current) cursorRef.current = document.querySelector(".cursor") as HTMLDivElement | null;
        if (!cursorInnerRef.current) cursorInnerRef.current = document.querySelector(".cursor_inner") as HTMLDivElement | null;
        if (!cursorPathRef.current) cursorPathRef.current = document.querySelector(".cursor_path") as SVGPathElement | null;
        if (!cursorSvgRef.current) cursorSvgRef.current = document.querySelector(".cursor_element svg") as SVGSVGElement | null;

        // init if allowed
        try {
            if (shouldEnableCursor()) init();
        } catch (err) {
            console.error("Cursor init error", err);
        }

        // cleanup on unmount
        return () => {
            try {
                cleanup();
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("Cursor cleanup error", err);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div ref={cursorRef} className="cursor" style={{ "opacity": 0 }}>
            <div ref={cursorInnerRef} className="cursor_inner" style={{ "opacity": 0, "transform": "scale(0.6)" }}>
                <div className="cursor_element">
                    <span className="cursor_text">MORE</span>
                    <svg
                        ref={cursorSvgRef as React.LegacyRef<SVGSVGElement>}

                        className="cursor_svg" xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="none" viewBox="0 0 100 100">
                        <path
                            ref={cursorPathRef as React.LegacyRef<SVGPathElement>}
                            className="cursor_path" fill="#000" d="M72 61.143 49 48l5.75 24L72 61.143Z" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default Cursor