// PatternParallax.jsx
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);
interface options {
    debug: boolean,
    patternDuration: number,
    isMobileCondition: boolean,
    imageCreateThrottle: number,
    burstMinDelay: number,
    burstMaxDelay: number,
    burstResumeDelay: number,
    burstDelta: number,
    burstActive: boolean,
    maxThrowDistance: number,
    movementThreshold: number,
    backgroundMaskConfig: Bgmaskconfig[],
    enableMouseAnimation: boolean,
    maxImagesPerSection: number,
    minImagesPerBurst: number,
    maxImagesPerBurst: number,
    imageMarginX: number,
    imageMarginY: number,
    imageHoldDuration: number,
    imageFadeOutDuration: number,
    imageEntryDuration: number,
    imageMovementDuration: number,
}

interface Bgmaskconfig {
    shape: { default: string, mobile: string }, container: string, pattern: string, outsideText: string, maskedText: string
}

let OPTIONS: options

export default function PatternParallax({ debug = false }) {
    const blockRef = useRef<HTMLDivElement>(null);
    const backgroundRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    // const svgRef = useRef(null);
    const createMediaFns = useRef([]);
    const observersRef = useRef([]);
    const blockMouseMoveHandlers = useRef([]);
    const unregisterResize = useRef(null);

    let ismobile
    // useEffect(() => {
    OPTIONS = {
        debug: false,
        patternDuration: 0.6,
        isMobileCondition: false,
        imageCreateThrottle: 175,
        burstMinDelay: 400,
        burstMaxDelay: 2000,
        burstResumeDelay: 3000,
        burstDelta: 40,
        burstActive: true,
        maxThrowDistance: 100,
        movementThreshold: 200,
        backgroundMaskConfig: [],
        enableMouseAnimation: false,
        maxImagesPerSection: 3,
        minImagesPerBurst: 1,
        maxImagesPerBurst: 2,
        imageMarginX: 22.5,
        imageMarginY: 10,
        imageHoldDuration: 1.5,
        imageFadeOutDuration: 0.4,
        imageEntryDuration: 0.6,
        imageMovementDuration: 1.5,
    };

    useEffect(() => {
        ismobile = window.matchMedia("(max-width: 600px)").matches
        OPTIONS.isMobileCondition = ismobile
    }, [])
    // }, [debug]);

    // Utility: read section configs from DOM
    function readBackgroundMaskConfig(sections: Element[]) {
        return sections.map((el) => {
            const s = el.getAttribute("data-mask-config");
            return s ? JSON.parse(s) : null;
        });
    }

    // Utility: build svg text tspans from multiline string
    function setSVGText(container: HTMLElement, value: string) {
        if (!container) return;
        container.innerHTML = "";
        const lines = value.split("\n");
        const p = -(lines.length - 1) / 2;
        lines.forEach((line, idx) => {
            const tspan = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "tspan"
            );
            tspan.setAttribute("x", "50%");
            tspan.setAttribute("dy", idx === 0 ? p + "em" : "0.9em");
            tspan.textContent = line;
            container.appendChild(tspan);
        });
    }

    // Animated swap of svg text
    function animateSVGText(container: HTMLElement, value: string) {
        if (!container) return;
        const unmasked = container.querySelector(".svg-text.-unmasked");
        const masked = container.querySelector(".svg-text.-masked");
        if (!unmasked || !masked) return;

        gsap.to([unmasked, masked], {
            opacity: 0,
            duration: 0.2,
            scale: 1.05,
            transformOrigin: "center center",
            ease: "power1.inOut",
            onComplete: () => {
                unmasked.innerHTML = "";
                masked.innerHTML = "";
                const lines = value.split("\n");
                const p = -(lines.length - 1) / 2;
                lines.forEach((line, idx) => {
                    const tspan = document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "tspan"
                    );
                    tspan.setAttribute("x", "50%");
                    tspan.setAttribute("dy", idx === 0 ? p + "em" : "0.9em");
                    tspan.textContent = line;
                    unmasked.appendChild(tspan.cloneNode(true));
                    masked.appendChild(tspan);
                });
                gsap.fromTo(
                    [unmasked, masked],
                    { opacity: 0, scale: 0.95, transformOrigin: "center center" },
                    { opacity: 1, scale: 1, duration: 0.2, ease: "power1.inOut" }
                );
            },
        });
    }

    // Apply a mask config to the mask container (colors + shapes)
    function applyMaskConfig(maskContainer: HTMLElement, cfg: { shape: { default: string, mobile: string }, container: string, pattern: string, outsideText: string, maskedText: string }, options: any) {
        if (!maskContainer || !cfg) return;
        // set CSS vars
        if (cfg.container)
            maskContainer.style.setProperty("--color-background", cfg.container);
        if (cfg.pattern) maskContainer.style.setProperty("--color-mask", cfg.pattern);
        if (cfg.outsideText)
            maskContainer.style.setProperty("--color-unmasked-text", cfg.outsideText);
        if (cfg.maskedText)
            maskContainer.style.setProperty("--color-masked-text", cfg.maskedText);

        // morph shapes (default and mobile)
        const sDefault = maskContainer.querySelector(".mask-path--default");
        const sMobile = maskContainer.querySelector(".mask-path--mobile");
        try {
            if (sDefault && cfg.shape && cfg.shape.default) {
                gsap.to(sDefault, {
                    duration: options.patternDuration,
                    morphSVG: options.isMobileCondition ? cfg.shape.mobile || cfg.shape.default : cfg.shape.default,
                    ease: "expo.inOut",
                });
            }
            if (sMobile && cfg.shape && cfg.shape.mobile) {
                gsap.to(sMobile, {
                    duration: options.patternDuration,
                    morphSVG: cfg.shape.mobile,
                    ease: "expo.inOut",
                });
            }
        } catch (err) {
            // MorphSVGPlugin might throw if shapes are incompatible; ignore gracefully
            // console.warn("morph error", err);
        }
    }

    // Returns restricted random pos inside width,height based on margins
    // function getRestrictedPosition(width: number, height: number, opts: any) {
    //     const a = (opts.imageMarginX / 100) * width;
    //     const b = (opts.imageMarginY / 100) * height;
    //     const m = Math.random();
    //     const o = Math.random();
    //     let x, y;
    //     x = m < 0.5 ? Math.random() * a : width - a + Math.random() * a;
    //     y = o < 0.5 ? Math.random() * b : height - b + Math.random() * b;
    //     return { x, y };
    // }

    // // Creates the burst scheduler for a given section element
    // function createBurstSchedulerForSection(section: HTMLElement, index: number, ctx: any) {
    //     const t = ctx;
    //     const r = OPTIONS;
    //     let disabledByMouse = false,
    //         burstTimeout = null,
    //         resumeTimeout = null,
    //         active = false;

    //     function scheduleNext() {
    //         if (disabledByMouse || !r.burstActive || !active) return;
    //         const delay =
    //             Math.random() * (r.burstMaxDelay - r.burstMinDelay) + r.burstMinDelay;
    //         burstTimeout = setTimeout(() => {
    //             if (disabledByMouse || !active) return;

    //             const sectionList = Array.from(ctx.block.querySelectorAll(".section"));
    //             const randomSection =
    //                 sectionList[Math.floor(Math.random() * sectionList.length)];
    //             const media = randomSection.querySelector(".section_media");
    //             if (!media) {
    //                 scheduleNext();
    //                 return;
    //             }
    //             const imgs = Array.from(media.querySelectorAll("img")).map((im) =>
    //                 im.getAttribute("src")
    //             );
    //             if (!imgs.length) {
    //                 scheduleNext();
    //                 return;
    //             }

    //             const l =
    //                 Math.floor(
    //                     Math.random() *
    //                     (OPTIONS.maxImagesPerBurst - OPTIONS.minImagesPerBurst + 1)
    //                 ) + OPTIONS.minImagesPerBurst;

    //             for (let b = 0; b < l; b++) {
    //                 if (
    //                     randomSection.querySelectorAll("img:not(.section_media img)").length >=
    //                     OPTIONS.maxImagesPerSection
    //                 )
    //                     continue;

    //                 const k = randomSection.getBoundingClientRect();
    //                 const pos = getRestrictedPosition(k.width, k.height, OPTIONS);
    //                 const w = (Math.random() - 0.5) * r.burstDelta;
    //                 const h = (Math.random() - 0.5) * r.burstDelta;
    //                 const S = sectionList.indexOf(randomSection);
    //                 if (S !== -1 && createMediaFns.current && createMediaFns.current[S]) {
    //                     createMediaFns.current[S](pos.x, pos.y, w, h);
    //                 }
    //             }
    //             scheduleNext();
    //         }, delay);
    //     }

    //     function pauseByMouse() {
    //         if (!OPTIONS.enableMouseAnimation) return;
    //         disabledByMouse = true;
    //         if (burstTimeout) {
    //             clearTimeout(burstTimeout);
    //             burstTimeout = null;
    //         }
    //         if (resumeTimeout) clearTimeout(resumeTimeout);
    //         resumeTimeout = setTimeout(() => {
    //             disabledByMouse = false;
    //             active && scheduleNext();
    //         }, r.burstResumeDelay);
    //     }

    //     function stop() {
    //         active = false;
    //         if (burstTimeout) {
    //             clearTimeout(burstTimeout);
    //             burstTimeout = null;
    //         }
    //         if (resumeTimeout) {
    //             clearTimeout(resumeTimeout);
    //             resumeTimeout = null;
    //         }
    //     }

    //     function start() {
    //         active = true;
    //         if (!disabledByMouse) scheduleNext();
    //     }

    //     // IntersectionObserver to only run bursts when block visible
    //     const io = new IntersectionObserver(
    //         (entries) => {
    //             entries.forEach((entry) => {
    //                 if (entry.isIntersecting) start();
    //                 else stop();
    //             });
    //         },
    //         { threshold: 0.1 }
    //     );
    //     io.observe(ctx.block);
    //     observersRef.current.push(io);

    //     // optionally attach mouse pause on the block
    //     if (OPTIONS.enableMouseAnimation) {
    //         const handler = () => pauseByMouse();
    //         ctx.block.addEventListener("mousemove", handler, false);
    //         blockMouseMoveHandlers.current.push(handler);
    //     }
    // }

    useGSAP(() => {
        const block = blockRef.current;
        // block as HTMLElement

        const background = backgroundRef.current;
        if (!block || !background) return;
        const ctx = { block, background };
        // Sections list
        const sections = Array.from(block.querySelectorAll(".section")) as HTMLElement[];
        OPTIONS.backgroundMaskConfig = readBackgroundMaskConfig(sections)
        // console.log(OPTIONS.backgroundMaskConfig);


        // cache references for svg text and mask paths
        const maskContainer = block.querySelector(".mask-container") as HTMLElement;
        if (!maskContainer) return;
        const unmaskedText = maskContainer?.querySelector(".svg-text.-unmasked");
        const maskedText = maskContainer?.querySelector(".svg-text.-masked");
        const maskDefaultPath = maskContainer?.querySelector(".mask-path--default");
        const maskMobilePath = maskContainer?.querySelector(".mask-path--mobile");

        // initialize with first config
        if (OPTIONS.backgroundMaskConfig[0]) {
            applyMaskConfig(maskContainer as HTMLElement, OPTIONS.backgroundMaskConfig[0], {
                patternDuration: OPTIONS.patternDuration,
                isMobileCondition: OPTIONS.isMobileCondition,
            });
        }
        // initial text from first section if present
        const firstText = sections[0] && sections[0].getAttribute("data-mask-text");
        const unmaskedesvgtext = maskContainer.querySelector(".svg-text.-unmasked");
        const maskedsvgtext = maskContainer.querySelector(".svg-text.-masked");
        if (!unmaskedesvgtext || !maskedsvgtext) return;
        if (firstText) setSVGText(unmaskedesvgtext as HTMLElement, firstText), setSVGText(maskedsvgtext as HTMLElement, firstText);

        // create ScrollTriggers to swap mask config + text on section enter/enterBack
        sections.forEach((sec, idx) => {
            const cfg = OPTIONS.backgroundMaskConfig[idx];
            const maskText = sec.getAttribute("data-mask-text");
            const last = idx === sections.length - 1;
            if (!cfg) return;

            const enterHandler = () => {
                // console.log(OPTIONS.backgroundMaskConfig[idx]);

                applyMaskConfig(maskContainer, cfg, {
                    patternDuration: OPTIONS.patternDuration,
                    isMobileCondition: OPTIONS.isMobileCondition,
                });
                if (maskText) animateSVGText(maskContainer, maskText);
            };

            if (idx === 0) {
                ScrollTrigger.create({
                    trigger: sec,
                    start: "top center",
                    end: "bottom center",
                    onEnterBack: enterHandler,
                });
                return
            } else if (last) {
                ScrollTrigger.create({
                    trigger: sec,
                    start: "top center",
                    end: "bottom center",
                    onEnter: enterHandler,
                });
            } else {
                ScrollTrigger.create({
                    trigger: sec,
                    start: "top center",
                    end: "bottom center",
                    onEnter: enterHandler,
                    onEnterBack: enterHandler,
                });
            }
        });

        // Pin the background
        const pin = ScrollTrigger.create({
            trigger: blockRef.current,
            start: "top top-=1px",
            end: "bottom bottom",
            pin: document.querySelector(".background"),
            pinSpacing: false,
            // markers: true,
            // pinType: "transform"
        });

        // // ---------- Image spawn logic for each section ----------
        // function hasImages() {
        //     return sections.some((s) => {
        //         const m = s.querySelector(".section_media");
        //         return m ? Array.from(m.querySelectorAll("img")).map((u) => u.getAttribute("src")).length > 0 : false;
        //     });
        // }

        // if (hasImages()) {
        //     createMediaFns.current = [];
        //     sections.forEach((s, idx) => {
        //         const media = s.querySelector(".section_media");
        //         if (!media) {
        //             createMediaFns.current[idx] = null;
        //             return;
        //         }
        //         const sources = Array.from(media.querySelectorAll("img")).map((img) =>
        //             img.getAttribute("src")
        //         );
        //         if (!sources.length) {
        //             createMediaFns.current[idx] = null;
        //             return;
        //         }

        //         // spawn function - appends an absolute-positioned image to the section and animates it
        //         let srcIndex = 0;
        //         const spawn = (x, y, dx = 0, dy = 0) => {
        //             const el = document.createElement("img");
        //             el.classList.add("no-lazy");
        //             el.setAttribute("src", sources[srcIndex]);
        //             el.style.position = "absolute";
        //             el.style.pointerEvents = "none";
        //             el.style.zIndex = "10";
        //             el.style.left = x + "px";
        //             el.style.top = y + "px";
        //             const vw = (18 + Math.random() * 4).toFixed(2) + "vw";
        //             const vh = (28 + Math.random() * 10).toFixed(2) + "vh";
        //             el.style.width = vw;
        //             el.style.height = vh;
        //             s.appendChild(el);

        //             const tl = gsap.timeline({
        //                 onComplete: () => {
        //                     try {
        //                         s.removeChild(el);
        //                     } catch (e) { }
        //                     tl.kill();
        //                 },
        //             });

        //             tl.fromTo(
        //                 el,
        //                 {
        //                     xPercent: -50 + (Math.random() - 0.5) * 80,
        //                     yPercent: -50 + (Math.random() - 0.5) * 10,
        //                     scaleX: 1.3,
        //                     scaleY: 1.3,
        //                     x: 0,
        //                     y: 0,
        //                 },
        //                 {
        //                     scaleX: 1,
        //                     scaleY: 1,
        //                     ease: "elastic.out(2, 0.6)",
        //                     duration: OPTIONS.imageEntryDuration,
        //                 }
        //             );

        //             const max = OPTIONS.maxThrowDistance || 400;
        //             const clamp = (v, S) => Math.max(Math.min(v, S), -S);
        //             const T = clamp(dx, max);
        //             const W = clamp(dy, max);

        //             tl.fromTo(
        //                 el,
        //                 { x: 0, y: 0, rotation: (Math.random() - 0.5) * 20 },
        //                 {
        //                     x: T * 4,
        //                     y: W * 4,
        //                     rotation: (Math.random() - 0.5) * 20,
        //                     ease: "power4.out",
        //                     duration: OPTIONS.imageMovementDuration,
        //                 },
        //                 "<"
        //             );
        //             tl.to(el, { duration: OPTIONS.imageHoldDuration, ease: "none" });
        //             tl.to(el, {
        //                 duration: OPTIONS.imageFadeOutDuration,
        //                 scale: 0.5,
        //                 opacity: 0,
        //                 ease: "power2.out",
        //             });

        //             srcIndex = (srcIndex + 1) % sources.length;
        //         };

        //         createMediaFns.current[idx] = spawn;

        //         // pointer-based "throw" logic (only if pointer: fine and enableMouseAnimation)
        //         if (window.matchMedia("(pointer: fine) and (hover: hover)").matches && OPTIONS.enableMouseAnimation) {
        //             let oX = 0,
        //                 oY = 0,
        //                 movement = 0,
        //                 lastCreate = 0,
        //                 acc = 0;
        //             const initMove = (ev) => {
        //                 const r = s.getBoundingClientRect();
        //                 oX = ev.clientX - r.left;
        //                 oY = ev.clientY - r.top;
        //             };
        //             s.addEventListener("mousemove", initMove, { once: true });
        //             s._mouseMoveInitHandler = initMove;

        //             const handler = (ev) => {
        //                 const r = s.getBoundingClientRect();
        //                 const mx = ev.clientX - r.left;
        //                 const my = ev.clientY - r.top;
        //                 acc += Math.abs(mx - oX) + Math.abs(my - oY);
        //                 let doCreate = false;
        //                 const now = Date.now();
        //                 if (acc > OPTIONS.movementThreshold || acc > window.innerWidth / 8) {
        //                     if (now - lastCreate >= OPTIONS.imageCreateThrottle) {
        //                         doCreate = true;
        //                         lastCreate = now;
        //                     }
        //                     acc = 0;
        //                 }
        //                 if (doCreate) spawn(mx, my, mx - oX, my - oY);
        //                 oX = mx;
        //                 oY = my;
        //             };
        //             s.addEventListener("mousemove", handler);
        //             s._mouseMoveHandler = handler;
        //         }
        //     });

        //     // create burst schedulers for sections that have images
        //     sections.forEach((s, i) => {
        //         const media = s.querySelector(".section_media");
        //         if (!media) return;
        //         const imgs = Array.from(media.querySelectorAll("img")).map((im) =>
        //             im.getAttribute("src")
        //         );
        //         if (!imgs.length) return;
        //         createBurstSchedulerForSection(s, i, ctx);
        //     });
        // }

        // // Keep track of resize unregister (simulate D.onResize from original)
        // const resizeHandler = () => {
        //     // re-evaluate ScrollTrigger
        //     ScrollTrigger.refresh();
        // };
        // window.addEventListener("resize", resizeHandler);
        // unregisterResize.current = () => window.removeEventListener("resize", resizeHandler);


    }, [debug]);

    // ----------------------
    // JSX: HTML -> JSX mapping of your provided HTML
    // ----------------------
    return (
        <section
            data-cid="pattern-parallax"
            data-js
            data-js-loaded="false"
            data-js-mounted="false"
            id="block_f435ebf6079f143a5d11c3c7ccc38384"
            className="block-pattern-parallax c-pattern-parallax u-default"
            ref={blockRef}
            style={{ position: "relative" }}
        >
            <div
                className="section"
                data-mask-config='{"shape":{"default":"m493.656 985-60.075-61.259-102.817-16.88-14.389-62.773-102.927 53.849L95.442 738.171l170.935-172.492-148.455 55.06L48 432.311 623.095 219l106.367 164.948-35.452 35.77 122.064-63.851 104.453 171.209-328.341 231.026 506.654-109.416L1155 841.134 493.656 985Z","mobile":"m493.656 985-60.075-61.259-102.817-16.88-14.389-62.773-102.927 53.849L95.442 738.171l170.935-172.492-148.455 55.06L48 432.311 623.095 219l106.367 164.948-35.452 35.77 122.064-63.851 104.453 171.209-328.341 231.026 506.654-109.416L1155 841.134 493.656 985Z"},"container":"#000000","pattern":"#e2d9d3","outsideText":"#e2d9d3","maskedText":"#ffffff"}'
                data-mask-text={`MULTI-AWARD
WINNING
ARCHITECTURE`}
            >
                <div className="section_media"></div>
            </div>

            <div
                className="section"
                data-mask-config='{"shape":{"default":"m637.424 218-30.367 129.792-224.307-9.499-38.688 161.681 60.855 27.719-381.054-14.428L0 680.015l468.806 117.918-192.283 17.381L291.766 984l688.743-62.262 13.009-166.49-167.282-42.067 1.157.04 38.309-161.701-56.306-25.643 286.514 12.113 13.65-76.949 68 10.337L1203 303.929 637.424 218Z","mobile":"m637.424 218-30.367 129.792-224.307-9.499-38.688 161.681 60.855 27.719-381.054-14.428L0 680.015l468.806 117.918-192.283 17.381L291.766 984l688.743-62.262 13.009-166.49-167.282-42.067 1.157.04 38.309-161.701-56.306-25.643 286.514 12.113 13.65-76.949 68 10.337L1203 303.929 637.424 218Z"},"container":"#00be21","pattern":"#60f63d","outsideText":"#60f63d","maskedText":"#003019"}'
                data-mask-text={`LONDON’S
BRIGHTEST NEW
CANAL SIDE
QUARTER`}
            >
                <div className="section_media"></div>
            </div>

            <div
                className="section"
                data-mask-config='{"shape":{"default":"M1014 788.149 307.315 985l-69.066-136.284 161.159-105.885-57.049-132.018 42.093-22.065-19.049-96.528-150.206 35.697L189 373.958 841.006 219l53.161 144.065-194.99 99.078 7.783 37.495 131.759-39.327 71.22 135.665-129.556 95.81 198.432-55.278L1014 788.149Z","mobile":"M1014 788.149 307.315 985l-69.066-136.284 161.159-105.885-57.049-132.018 42.093-22.065-19.049-96.528-150.206 35.697L189 373.958 841.006 219l53.161 144.065-194.99 99.078 7.783 37.495 131.759-39.327 71.22 135.665-129.556 95.81 198.432-55.278L1014 788.149Z"},"container":"#ffa5c1","pattern":"#ff6606","outsideText":"#ff6606","maskedText":"#380921"}'
                data-mask-text={`ONSITE
CO-WORKING & 
CREATIVE SPACE`}
            >
                <div className="section_media"></div>
            </div>

            <div
                className="section"
                data-mask-config='{"shape":{"default":"m561.209 219 46.902 128.988 166.876-8.416 64.191 155.02-61.615 33.482 298.707-13.511L1118 678.641l-403.6 121.1 160.365 17.294L847.427 985l-577.493-62.306-22.313-163.461L407.37 711.3l-62.231-151.893 57.585-31.307-218.867 11.04-32.19-102.75-39.033 4.427L84 272.994 561.209 219Z","mobile":"m561.209 219 46.902 128.988 166.876-8.416 64.191 155.02-61.615 33.482 298.707-13.511L1118 678.641l-403.6 121.1 160.365 17.294L847.427 985l-577.493-62.306-22.313-163.461L407.37 711.3l-62.231-151.893 57.585-31.307-218.867 11.04-32.19-102.75-39.033 4.427L84 272.994 561.209 219Z"},"container":"#9786fa","pattern":"#7ce0f6","outsideText":"#7ce0f6","maskedText":"#10162d"}'
                data-mask-text={`COMMUNAL
ROOFTOP
GARDEN SPACE`}
            >
                <div className="section_media"></div>
            </div>

            <div
                className="section"
                data-mask-config='{"shape":{"default":"m709.344 985 60.075-61.259 102.817-16.88 14.389-62.773 102.927 53.849 118.008-159.766-170.937-172.492 148.457 55.06L1155 432.311 579.905 219 473.538 383.948l35.452 35.77-122.064-63.851-104.453 171.209 328.341 231.026-506.651-109.416L48 841.134 709.344 985Z","mobile":"m709.344 985 60.075-61.259 102.817-16.88 14.389-62.773 102.927 53.849 118.008-159.766-170.937-172.492 148.457 55.06L1155 432.311 579.905 219 473.538 383.948l35.452 35.77-122.064-63.851-104.453 171.209 328.341 231.026-506.651-109.416L48 841.134 709.344 985Z"},"container":"#ff6606","pattern":"#ffa5c1","outsideText":"#ffa5c1","maskedText":"#380921"}'
                data-mask-text={`ONSITE
RETAIL &
RESTAURANTS`}
            >
                <div className="section_media"></div>
            </div>

            <div
                className="section"
                data-mask-config='{"shape":{"default":"m637.424 985-30.367-129.792-224.307 9.499-38.688-161.681 60.855-27.719-381.054 14.428L0 522.985l468.806-117.918-192.283-17.381L291.766 219l688.743 62.262 13.009 166.49-167.282 42.067 1.157-.04 38.309 161.701-56.306 25.643 286.514-12.113 13.65 76.949 68-10.337L1203 899.071 637.424 985Z","mobile":"m637.424 985-30.367-129.792-224.307 9.499-38.688-161.681 60.855-27.719-381.054 14.428L0 522.985l468.806-117.918-192.283-17.381L291.766 219l688.743 62.262 13.009 166.49-167.282 42.067 1.157-.04 38.309 161.701-56.306 25.643 286.514-12.113 13.65 76.949 68-10.337L1203 899.071 637.424 985Z"},"container":"#60f63d","pattern":"#003019","outsideText":"#00be21","maskedText":"#60f63d"}'
                data-mask-text={`NEW PUBLIC
REALM &
LINEAR PARK`}
            >
                <div className="section_media"></div>
            </div>

            <figure className="background">
                <div
                    id="block_f435ebf6079f143a5d11c3c7ccc38384-container"
                    className="mask-container"
                    ref={backgroundRef}
                    style={{
                        // initial values from your HTML
                        "--color-background": "#000000",
                        "--color-unmasked-text": "#E2D9D3",
                        "--color-masked-text": "#FFFFFF",
                        "--color-mask": "#E2D9D3",
                        position: "relative",
                        display: "block",
                    } as React.CSSProperties}
                    data-ref="background"
                >
                    <div className="mask-wrapper">
                        <svg
                            id="block_f435ebf6079f143a5d11c3c7ccc38384-svg"
                            className="mask-svg"
                            viewBox="0 0 1203 1203"
                            preserveAspectRatio="xMidYMid slice"
                            ref={svgRef}
                        >
                            <defs>
                                <mask id="block_f435ebf6079f143a5d11c3c7ccc38384-mask">
                                    <path
                                        className="mask-path--default"
                                        id="block_f435ebf6079f143a5d11c3c7ccc38384-path-default"
                                        fill="white"
                                        d="m493.656 985-60.075-61.259-102.817-16.88-14.389-62.773-102.927 53.849L95.442 738.171l170.935-172.492-148.455 55.06L48 432.311 623.095 219l106.367 164.948-35.452 35.77 122.064-63.851 104.453 171.209-328.341 231.026 506.654-109.416L1155 841.134 493.656 985Z"
                                    />
                                    <path
                                        className="mask-path--mobile"
                                        id="block_f435ebf6079f143a5d11c3c7ccc38384-path-mobile"
                                        fill="white"
                                        d="m684.665 263.504 54.489 51.887 90.62 11.713 14.493 54.583 88.596-50.278 108.217 136.483-144.649 156.296 128.459-52.704 66.93 163.044L594.175 938.71l-98.168-141.374 29.999-32.411-105.069 59.617-96.679-146.918 280.851-212.313-440.776 111.077-54.992-166.979 575.324-145.905Z"
                                    />
                                </mask>
                            </defs>

                            <text
                                className="svg-text -unmasked"
                                id="block_f435ebf6079f143a5d11c3c7ccc38384-outside-text"
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{ fill: "var(--color-unmasked-text)" }}
                            >
                                <tspan x="50%" dy="-2em">
                                    MULTI-AWARD
                                </tspan>
                                <tspan x="50%" dy="1em"></tspan>
                                <tspan x="50%" dy="1em">
                                    WINNING
                                </tspan>
                                <tspan x="50%" dy="1em"></tspan>
                                <tspan x="50%" dy="1em">
                                    ARCHITECTURE
                                </tspan>
                            </text>

                            <g mask="url(#block_f435ebf6079f143a5d11c3c7ccc38384-mask)">
                                <rect
                                    width="1203"
                                    height="1203"
                                    id="block_f435ebf6079f143a5d11c3c7ccc38384-rect"

                                />
                                <text
                                    className="svg-text -masked"
                                    id="block_f435ebf6079f143a5d11c3c7ccc38384-masked-text"
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{ fill: "var(--color-masked-text)" }}
                                >
                                    <tspan x="50%" dy="-2em">
                                        MULTI-AWARD
                                    </tspan>
                                    <tspan x="50%" dy="1em"></tspan>
                                    <tspan x="50%" dy="1em">
                                        WINNING
                                    </tspan>
                                    <tspan x="50%" dy="1em"></tspan>
                                    <tspan x="50%" dy="1em">
                                        ARCHITECTURE
                                    </tspan>
                                </text>
                            </g>
                        </svg>
                    </div>
                </div>
            </figure>
        </section>
    );
}





// import React from 'react'

// const PatternParallax = () => {
//     return (
//         <section data-cid="pattern-parallax" data-js data-js-loaded="false" data-js-mounted="false" id="block_f435ebf6079f143a5d11c3c7ccc38384" className="block-pattern-parallax   c-pattern-parallax u-default">
//             <div className="section" data-mask-config='{"shape":{"default":"m493.656 985-60.075-61.259-102.817-16.88-14.389-62.773-102.927 53.849L95.442 738.171l170.935-172.492-148.455 55.06L48 432.311 623.095 219l106.367 164.948-35.452 35.77 122.064-63.851 104.453 171.209-328.341 231.026 506.654-109.416L1155 841.134 493.656 985Z","mobile":"m493.656 985-60.075-61.259-102.817-16.88-14.389-62.773-102.927 53.849L95.442 738.171l170.935-172.492-148.455 55.06L48 432.311 623.095 219l106.367 164.948-35.452 35.77 122.064-63.851 104.453 171.209-328.341 231.026 506.654-109.416L1155 841.134 493.656 985Z"},"container":"#000000","pattern":"#e2d9d3","outsideText":"#e2d9d3","maskedText":"#ffffff"}' data-mask-text="MULTI-AWARD
// WINNING
// ARCHITECTURE">
//                 <div className="section_media"></div>
//             </div>
//             <div className="section" data-mask-config='{"shape":{"default":"m637.424 218-30.367 129.792-224.307-9.499-38.688 161.681 60.855 27.719-381.054-14.428L0 680.015l468.806 117.918-192.283 17.381L291.766 984l688.743-62.262 13.009-166.49-167.282-42.067 1.157.04 38.309-161.701-56.306-25.643 286.514 12.113 13.65-76.949 68 10.337L1203 303.929 637.424 218Z","mobile":"m637.424 218-30.367 129.792-224.307-9.499-38.688 161.681 60.855 27.719-381.054-14.428L0 680.015l468.806 117.918-192.283 17.381L291.766 984l688.743-62.262 13.009-166.49-167.282-42.067 1.157.04 38.309-161.701-56.306-25.643 286.514 12.113 13.65-76.949 68 10.337L1203 303.929 637.424 218Z"},"container":"#00be21","pattern":"#60f63d","outsideText":"#60f63d","maskedText":"#003019"}' data-mask-text="LONDON’S
// BRIGHTEST NEW
// CANAL SIDE
// QUARTER">
//                 <div className="section_media"></div>
//             </div>
//             <div className="section" data-mask-config='{"shape":{"default":"M1014 788.149 307.315 985l-69.066-136.284 161.159-105.885-57.049-132.018 42.093-22.065-19.049-96.528-150.206 35.697L189 373.958 841.006 219l53.161 144.065-194.99 99.078 7.783 37.495 131.759-39.327 71.22 135.665-129.556 95.81 198.432-55.278L1014 788.149Z","mobile":"M1014 788.149 307.315 985l-69.066-136.284 161.159-105.885-57.049-132.018 42.093-22.065-19.049-96.528-150.206 35.697L189 373.958 841.006 219l53.161 144.065-194.99 99.078 7.783 37.495 131.759-39.327 71.22 135.665-129.556 95.81 198.432-55.278L1014 788.149Z"},"container":"#ffa5c1","pattern":"#ff6606","outsideText":"#ff6606","maskedText":"#380921"}' data-mask-text="ONSITE
// CO-WORKING &amp;
// CREATIVE SPACE">
//                 <div className="section_media"></div>
//             </div>
//             <div className="section" data-mask-config='{"shape":{"default":"m561.209 219 46.902 128.988 166.876-8.416 64.191 155.02-61.615 33.482 298.707-13.511L1118 678.641l-403.6 121.1 160.365 17.294L847.427 985l-577.493-62.306-22.313-163.461L407.37 711.3l-62.231-151.893 57.585-31.307-218.867 11.04-32.19-102.75-39.033 4.427L84 272.994 561.209 219Z","mobile":"m561.209 219 46.902 128.988 166.876-8.416 64.191 155.02-61.615 33.482 298.707-13.511L1118 678.641l-403.6 121.1 160.365 17.294L847.427 985l-577.493-62.306-22.313-163.461L407.37 711.3l-62.231-151.893 57.585-31.307-218.867 11.04-32.19-102.75-39.033 4.427L84 272.994 561.209 219Z"},"container":"#9786fa","pattern":"#7ce0f6","outsideText":"#7ce0f6","maskedText":"#10162d"}' data-mask-text="COMMUNAL
// ROOFTOP
// GARDEN SPACE">
//                 <div className="section_media"></div>
//             </div>
//             <div className="section" data-mask-config='{"shape":{"default":"m709.344 985 60.075-61.259 102.817-16.88 14.389-62.773 102.927 53.849 118.008-159.766-170.937-172.492 148.457 55.06L1155 432.311 579.905 219 473.538 383.948l35.452 35.77-122.064-63.851-104.453 171.209 328.341 231.026-506.651-109.416L48 841.134 709.344 985Z","mobile":"m709.344 985 60.075-61.259 102.817-16.88 14.389-62.773 102.927 53.849 118.008-159.766-170.937-172.492 148.457 55.06L1155 432.311 579.905 219 473.538 383.948l35.452 35.77-122.064-63.851-104.453 171.209 328.341 231.026-506.651-109.416L48 841.134 709.344 985Z"},"container":"#ff6606","pattern":"#ffa5c1","outsideText":"#ffa5c1","maskedText":"#380921"}' data-mask-text="ONSITE
// RETAIL &amp;
// RESTAURANTS">
//                 <div className="section_media"></div>
//             </div>
//             <div className="section" data-mask-config='{"shape":{"default":"m637.424 985-30.367-129.792-224.307 9.499-38.688-161.681 60.855-27.719-381.054 14.428L0 522.985l468.806-117.918-192.283-17.381L291.766 219l688.743 62.262 13.009 166.49-167.282 42.067 1.157-.04 38.309 161.701-56.306 25.643 286.514-12.113 13.65 76.949 68-10.337L1203 899.071 637.424 985Z","mobile":"m637.424 985-30.367-129.792-224.307 9.499-38.688-161.681 60.855-27.719-381.054 14.428L0 522.985l468.806-117.918-192.283-17.381L291.766 219l688.743 62.262 13.009 166.49-167.282 42.067 1.157-.04 38.309 161.701-56.306 25.643 286.514-12.113 13.65 76.949 68-10.337L1203 899.071 637.424 985Z"},"container":"#60f63d","pattern":"#003019","outsideText":"#00be21","maskedText":"#60f63d"}' data-mask-text="NEW PUBLIC
// REALM &amp;
// LINEAR PARK">
//                 <div className="section_media"></div>
//             </div>
//             <figure className="background">
//                 <div id="block_f435ebf6079f143a5d11c3c7ccc38384-container" className="mask-container" style={{
//                     "--color-background": "#000000",
//                     "--color-unmasked-text": "#E2D9D3",
//                     "--color-masked-text": "#FFFFFF",
//                     "--color-mask": "#E2D9D3",
//                 } as React.CSSProperties} data-ref="background">
//                     <div className="mask-wrapper">
//                         <svg id="block_f435ebf6079f143a5d11c3c7ccc38384-svg" className="mask-svg" viewBox="0 0 1203 1203" preserveAspectRatio="xMidYMid slice">
//                             <defs>
//                                 <mask id="block_f435ebf6079f143a5d11c3c7ccc38384-mask">
//                                     <path className="mask-path--default" id="block_f435ebf6079f143a5d11c3c7ccc38384-path-default" fill="white" d="m493.656 985-60.075-61.259-102.817-16.88-14.389-62.773-102.927 53.849L95.442 738.171l170.935-172.492-148.455 55.06L48 432.311 623.095 219l106.367 164.948-35.452 35.77 122.064-63.851 104.453 171.209-328.341 231.026 506.654-109.416L1155 841.134 493.656 985Z" />
//                                     <path className="mask-path--mobile" id="block_f435ebf6079f143a5d11c3c7ccc38384-path-mobile" fill="white" d="m684.665 263.504 54.489 51.887 90.62 11.713 14.493 54.583 88.596-50.278 108.217 136.483-144.649 156.296 128.459-52.704 66.93 163.044L594.175 938.71l-98.168-141.374 29.999-32.411-105.069 59.617-96.679-146.918 280.851-212.313-440.776 111.077-54.992-166.979 575.324-145.905Z" />
//                                 </mask>
//                             </defs>
//                             <text className="svg-text -unmasked" id="block_f435ebf6079f143a5d11c3c7ccc38384-outside-text" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">
//                                 <tspan x="50%" dy="-2em">MULTI-AWARD</tspan>
//                                 <tspan x="50%" dy="1em"></tspan>
//                                 <tspan x="50%" dy="1em">WINNING</tspan>
//                                 <tspan x="50%" dy="1em"></tspan>
//                                 <tspan x="50%" dy="1em">ARCHITECTURE</tspan>
//                             </text>
//                             <g mask="url(#block_f435ebf6079f143a5d11c3c7ccc38384-mask)">
//                                 <rect width="1203" height="1203" id="block_f435ebf6079f143a5d11c3c7ccc38384-rect" />
//                                 <text className="svg-text -masked" id="block_f435ebf6079f143a5d11c3c7ccc38384-masked-text" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">
//                                     <tspan x="50%" dy="-2em">MULTI-AWARD</tspan>
//                                     <tspan x="50%" dy="1em"></tspan>
//                                     <tspan x="50%" dy="1em">WINNING</tspan>
//                                     <tspan x="50%" dy="1em"></tspan>
//                                     <tspan x="50%" dy="1em">ARCHITECTURE</tspan>
//                                 </text>
//                             </g>
//                         </svg>
//                     </div>
//                 </div>
//             </figure>
//         </section>
//     )
// }

// export default PatternParallax