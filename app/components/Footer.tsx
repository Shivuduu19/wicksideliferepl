"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);
type AnyEl = HTMLElement | null;
const Footer = () => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const timelinesRef = useRef<any[]>([]);
    const cleanupHandlersRef = useRef<(() => void)[]>([]);
    const $one = (sel: string) => {
        return rootRef.current ? (rootRef.current.querySelector(sel) as AnyEl) : null;
    };

    const $all = (sel: string) => {
        return rootRef.current ? Array.from(rootRef.current.querySelectorAll(sel)) as HTMLElement[] : [];
    };


    // SplitText hover dim effect for elements with data-split
    function initSplitHoverEffects() {
        const els = $all("[data-split]");
        if (!els.length) return;

        const largeHover = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)").matches;

        els.forEach((el) => {
            // create split instance (chars/words) using GSAP SplitText
            let split: any;
            try {
                split = new (SplitText as any)(el, {
                    type: "chars,words",
                    charsClass: "char",
                    wordsClass: "word",
                });
            } catch {
                // fallback: wrap chars
                const chars = Array.from(el.textContent || "").map(ch => {
                    const span = document.createElement("span");
                    span.className = "char";
                    span.textContent = ch;
                    return span;
                });
                el.innerHTML = "";
                chars.forEach(c => el.appendChild(c));
                split = { chars: Array.from(el.querySelectorAll(".char")) };
            }

            if (!largeHover) return;

            const onEnter = () => {
                const t = gsap.timeline();
                t.to(split.chars, {
                    opacity: 0.4,
                    transformOrigin: "center center",
                    ease: "power2.out",
                    duration: 0.2,
                });
                t.to(split.chars, {
                    opacity: 1,
                    duration: 0.2,
                    ease: "power2.out",
                    stagger: 0.04,
                }, "-=0.1");
                timelinesRef.current.push(t);
            };

            el.addEventListener("mouseenter", onEnter);
            cleanupHandlersRef.current.push(() => el.removeEventListener("mouseenter", onEnter));
        });
    }

    // Landing heading per-char hover
    function initLandingHeadingEffect() {
        const heading = rootRef.current?.querySelector<HTMLElement>(".landing_heading");
        if (!heading) return;

        let split: any;
        try {
            split = new (SplitText as any)(heading, {
                type: "words,chars",
                wordsClass: "word",
                charsClass: "char",
            });
        } catch {
            // fallback simple char wrap
            const text = heading.textContent || "";
            heading.innerHTML = "";
            [...text].forEach(ch => {
                const span = document.createElement("span");
                span.className = "char";
                span.textContent = ch;
                heading.appendChild(span);
            });
            split = { chars: Array.from(heading.querySelectorAll(".char")) };
        }

        split.chars.forEach((tEl: HTMLElement) => {
            let enterTl: GSAPTimeline | null = null;
            let leaveTl: GSAPTimeline | null = null;

            // const onEnter = () => {
            //     // stop opposite animation
            //     enterTl?.kill();

            //     // restart or create enter animation
            //     // if (!enterTl) {
            //     enterTl = gsap.timeline({ paused: true })
            //         .to(tEl, {
            //             scale: 1.2,
            //             rotationZ: gsap.utils.random(-5, 5),
            //             duration: 0.25,
            //             ease: "power2.out",
            //         });
            //     // }

            //     enterTl.play(); // play from start
            // };

            // const onLeave = () => {
            //     // stop opposite animation
            //     leaveTl?.kill();

            //     // restart or create leave animation
            //     // if (!leaveTl) {
            //     leaveTl = gsap.timeline({ paused: true })
            //         .to(tEl, {
            //             scale: 1,
            //             rotationZ: 0,
            //             duration: 0.3,
            //             ease: "back.out(3)",
            //         });
            //     // }

            //     leaveTl.play();
            // };

            let tl: any = null;
            const onEnter = () => {
                if (tl) tl.kill && tl.kill();
                const rotation = gsap.utils.random ? gsap.utils.random(-5, 5) : (Math.random() - 0.5) * 10;
                tl = gsap.timeline();
                tl.to(tEl, {
                    scale: 1.2,
                    rotationZ: rotation,
                    ease: "power2.out",
                    duration: 0.25,
                    overwrite: "auto",
                });
                timelinesRef.current.push(tl);
            };
            const onLeave = () => {
                if (tl) tl.kill && tl.kill();
                tl = gsap.timeline();
                tl.to(tEl, {
                    scale: 1,
                    rotationZ: 0,
                    ease: "back.out(3)",
                    duration: 0.3,
                    overwrite: "auto",
                });
                timelinesRef.current.push(tl);
            };
            tEl.addEventListener("mouseenter", onEnter);
            tEl.addEventListener("mouseleave", onLeave);
            cleanupHandlersRef.current.push(() => {
                tEl.removeEventListener("mouseenter", onEnter);
                tEl.removeEventListener("mouseleave", onLeave);
            });
        });
    }

    // Watermark path hover animation
    function initWatermarkEffect() {
        const svg = rootRef.current?.querySelector<SVGSVGElement>("svg.watermark_image");
        if (!svg) return;

        const hoverFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const wide = window.matchMedia("(min-width: 1025px)").matches;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (!hoverFine || !wide || reduceMotion) return;

        const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path"));
        if (!paths.length) return;

        try {
            gsap.set(paths, { transformOrigin: "center center" });
        } catch { /* ignore */ }

        paths.forEach((p) => {
            let busy = false;
            const onEnter = () => {
                if (busy) return;
                busy = true;
                const r = gsap.utils.random ? gsap.utils.random(-5, 5) : (Math.random() - 0.5) * 10;
                const tl = gsap.timeline({
                    onComplete: () => { busy = false; }
                });
                tl.to(p, { y: 8, rotationZ: r, ease: "power2.out", duration: 0.25 });
                tl.to(p, { y: 0, rotationZ: 0, ease: "power2.out", duration: 0.3 });
                timelinesRef.current.push(tl);
            };
            p.addEventListener("mouseenter", onEnter);
            cleanupHandlersRef.current.push(() => p.removeEventListener("mouseenter", onEnter));
        });
    }

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        // Initialize form
        const form = root.querySelector<HTMLFormElement>("[data-ref='form']");
        // if (form) {
        //   initializeFormFields(form);
        //   form.addEventListener("submit", handleSubmit as EventListener);
        //   cleanupHandlersRef.current.push(() => form.removeEventListener("submit", handleSubmit as EventListener));
        // }

        // Init split hover, heading, watermark
        initSplitHoverEffects();
        initLandingHeadingEffect();
        initWatermarkEffect();

        // Cleanup on unmount
        return () => {
            // kill timelines
            timelinesRef.current.forEach(tl => { try { tl.kill && tl.kill(); } catch { } });
            timelinesRef.current = [];
            // run all cleanup handlers
            cleanupHandlersRef.current.forEach(fn => {
                try { fn(); } catch { }
            });
            cleanupHandlersRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <footer
            ref={rootRef}
            data-cursor-color="var(--color--14)" data-js data-js-loaded="false" data-js-mounted="false" className="-landing c-footer u-default" style={{ "--footer-background-color": "#000000", "--footer-bottom-background-color": "#e2d9d3", "--footer-bottom-text-color": "#000000" } as React.CSSProperties}>
            <div className="main u-container u-container--pad inview-trigger">
                <div className="main_section -menu inview-element">
                    <div className="footer_landing">
                        <div className="landing_heading">
                            Life in<br />Colour

                        </div>
                        <div className="landing_subheading">
                            Coming<br />Early 2026

                        </div>
                    </div>
                </div>
                <div className="main_section -contact">
                    <div className="section_part -desktop--minheight inview-element">
                        <div className="section_title">Let’s Talk</div>
                        <div className="section_text">
                            <p></p>
                            <p>
                                <a className="contact_link" href="mailto:wow@wicksidelife.com" aria-label="Email us" target="_blank" data-split="" data-split-color="#e2d9d3" data-cursor="default">wow@wicksidelife.com</a>
                            </p>
                        </div>
                    </div>
                    <div className="section_part -desktop--minheight inview-element">
                        <div className="section_title">Find us</div>
                        <address className="section_text">
                            <p>
                                Hertford Union Canal<br />Hackney Wick, London, E9 5HH
                            </p>
                        </address>
                        <a className="u-btn--2 contact_btn" href="https://www.google.com/maps/dir//Hackney%20Wick,%20London" aria-label="Map" target="_blank">
                            <span className="btn_label">Map</span>
                            <div className="btn_arrow">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 12 12">
                                    <path fill="#fff" d="M0 1.312V0h10.46v.682L11.047.1l.934.927-.604.6H12V12h-1.322V2.32l-9.034 8.96-.935-.928 9.116-9.04H0Z" />
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 12 12">
                                    <path fill="#fff" d="M0 1.312V0h10.46v.682L11.047.1l.934.927-.604.6H12V12h-1.322V2.32l-9.034 8.96-.935-.928 9.116-9.04H0Z" />
                                </svg>
                            </div>
                        </a>
                    </div>
                </div>
                <div className="main_section -newsletter">
                    <div className="section_part inview-element">
                        <div className="section_title">Stay in the loop</div>
                        <div className="section_text">
                            <p>Sign up for Wickside emails to be the first one to see inspiring content news and exclusive offers.</p>
                        </div>
                        <form className="newsletter_form" data-ref="form" data-success-message="&lt;p&gt;You’re now subscribed, we’ll see you in your inbox shortly!&lt;/p&gt;" data-error-message="&lt;p&gt;Something happened that prevented you from subscribing. Please try again later.&lt;/p&gt;" action="https://formcarry.com/s/cRgxjHq3v0l" method="POST" acceptCharset="utf-8" data-inview>
                            <div className="form_wrapper" data-ref="fields">
                                <div className="form_field">
                                    <label htmlFor="email">Email Address</label>
                                    <input type="email" name="email" id="email" autoComplete="email" placeholder="Email Address" required />
                                </div>
                                <button type="submit" className="form_submit " aria-label="Subscribe" data-cursor="default"></button>
                            </div>
                            <div className="form_response u-wysiwyg-text--1 u-wysiwyg-lists--1" data-ref="response"></div>
                        </form>
                    </div>
                    <div className="section_part inview-element">
                        <a className="section_cta" href="https://www.instagram.com/wicksidelife/" target="_blank" data-split="" data-split-color="#e2d9d3">
                            Let’s get social
                            <div className="cta_arrow">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                                    <path fill="#fff" d="M2.936 16 .36 13.453h11.176L0 1.918 1.888 0l11.535 11.536V.39L16 2.966V16H2.936Z" />
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                                    <path fill="#fff" d="M2.936 16 .36 13.453h11.176L0 1.918 1.888 0l11.535 11.536V.39L16 2.966V16H2.936Z" />
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                                    <path fill="#fff" d="M2.936 16 .36 13.453h11.176L0 1.918 1.888 0l11.535 11.536V.39L16 2.966V16H2.936Z" />
                                </svg>
                            </div>
                            <br />
                            <strong>@wicksidelife</strong>
                        </a>
                    </div>
                </div>
                <div className="main_section -submenu">
                    <div className="section_part -desktop--minheight -desktop-only -landing-only inview-element">
                        <div className="section_title">Partner Links</div>
                        <ul className='footer_menu -submenu'>
                            <li className='menu_item'>
                                <a className="item_link" href="https://www.galliardhomes.com/wickside" aria-label="Properties For Sale" target="_blank" data-cursor="default" data-split="" data-split-color="#e2d9d3">Properties For Sale</a>
                            </li>
                        </ul>
                    </div>
                    <div className="section_part -mobile-links inview-element">
                        <ul className='footer_menu -mobile'>
                            <li className='menu_item'>
                                <a className="item_link" href="https://www.galliardhomes.com/wickside" aria-label="Homes For Sale" target="_blank" data-cursor="default" data-split="" data-split-color="#e2d9d3">Homes For Sale</a>
                            </li>
                            <li className='menu_item'>
                                <a className="item_link" href="https://www.galliardhomes.com/wickside" aria-label="Commercial Spaces" target="_blank" data-cursor="default" data-split="" data-split-color="#e2d9d3">Commercial Spaces</a>
                            </li>
                            <li className='menu_item'>
                                <a className="item_link" href="/terms-and-conditions/" aria-label="Terms & Conditions" target="_self" data-cursor="default" data-split="" data-split-color="#e2d9d3">Terms & Conditions</a>
                            </li>
                            <li className='menu_item'>
                                <a className="item_link" href="/privacy-policy/" aria-label="Privacy" target="_self" data-cursor="default" data-split="" data-split-color="#e2d9d3">Privacy</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="bottom" role="contentinfo">
                <figure className="bottom_watermark">
                    <svg className="watermark_image" xmlns="http://www.w3.org/2000/svg" width="390" height="79" fill="none" viewBox="0 0 390 79">
                        <path fill="#E2D9D3" d="M369.271 17.714h19.321V1.758h-38.537v75.455H390V61.257h-20.729V47.784h17.598V31.94h-17.598V17.714Z" />
                        <path fill="#E2D9D3" d="M318.746 1.758c16.771 0 25.157 12.577 25.157 37.731 0 25.155-8.386 37.732-25.157 37.732h-21.163V1.758h21.163Zm-1.94 15.956v43.544h.54c2.522 0 4.371-1.56 5.562-4.687 1.184-3.127 1.779-8.82 1.78-17.09 0-8.267-.596-13.962-1.78-17.082-1.191-3.125-3.04-4.685-5.562-4.685h-.54Z" />
                        <path fill="#E2D9D3" d="M270.17 77.214h19.216V1.758H270.17v75.456Z" />
                        <path fill="#E2D9D3" d="M258.4 6.506c-3.67-3.812-8.924-5.715-16.196-5.715-7.272 0-12.975 1.909-17.115 5.715-4.14 3.813-6.206 9.773-6.206 17.893 0 4.093.504 7.618 1.513 10.563 1.008 2.945 2.326 5.19 3.944 6.736a23.813 23.813 0 0 0 5.394 3.883c1.983 1.042 3.937 1.889 5.884 2.532 1.948.651 3.728 1.329 5.346 2.049 1.625.721 2.935 1.783 3.944 3.183 1.009 1.399 1.513 3.141 1.513 5.225 0 1.294-.308 2.393-.917 3.288-.61.903-1.458 1.35-2.536 1.35-1.948 0-3.265-.811-3.945-2.427-.686-1.623-.735-4.694-.161-9.22l-19.65 5.282c0 7.114 1.835 12.465 5.506 16.06 3.671 3.589 9.43 5.387 17.276 5.387l.007.014c15.188 0 22.782-7.583 22.782-22.748 0-4.093-.505-7.618-1.513-10.563-1.009-2.945-2.327-5.19-3.945-6.736a22.874 22.874 0 0 0-5.401-3.826c-1.983-1.001-3.944-1.833-5.885-2.477a43.283 43.283 0 0 1-5.345-2.154c-1.618-.791-2.928-1.889-3.937-3.288-1.009-1.407-1.513-3.183-1.513-5.337 0-3.596 1.191-5.393 3.566-5.393.504 0 .918.056 1.24.16.322.112.736.378 1.24.812.504.434.812 1.098.917 1.994.145 1.255.272 2.511.379 3.77.14 1.615 0 3.61-.435 5.981l19.756-5.281c0-7.332-1.836-12.9-5.507-16.712Z" />
                        <path fill="#E2D9D3" d="m186.825 35.712 8.316-33.954h24.722l-16.301 28.785 14.249 46.678h-23.105l-2.914-25.98-4.967 8.73v17.25h-19.217V1.758h19.217v33.954Z" />
                        <path fill="#E2D9D3" d="M156.28 8.752c-3.706-5.393-9.556-8.086-17.542-8.086-15.475 0-23.209 13.011-23.209 39.019 0 26.007 7.734 38.591 23.209 38.591 7.987 0 13.836-2.692 17.542-8.086 3.265-4.749 5.142-11.871 5.647-21.356l-19.097-4.498v.015c-.014 3.161-.05 5.7-.099 7.581-.07 2.624-.251 4.8-.539 6.52-.287 1.728-.687 2.806-1.191 3.233-.504.434-1.261.644-2.263.644-1.078 0-1.891-.47-2.43-1.4-.54-.931-.953-3.058-1.241-6.358-.287-3.302-.434-8.262-.434-14.88 0-6.617.147-11.801.434-15.144.288-3.343.701-5.498 1.241-6.47.539-.972 1.352-1.454 2.43-1.454 1.009 0 1.766.216 2.263.65.504.433.897 1.51 1.191 3.23.288 1.722.469 3.897.539 6.52.049 1.924.085 4.519.099 7.779l19.104-4.497c-.484-9.583-2.368-16.768-5.654-21.553Z" />
                        <path fill="#E2D9D3" d="M90.099 77.214h19.216V1.758H90.099v75.456Z" />
                        <path fill="#E2D9D3" d="m32.484 1.758-6.367 53.254L22.88 1.758H0l12.19 75.455h25.27l5.184-43.873 5.287 43.874h25.48L85.706 1.758H62.294l-3.132 52.064h-.007L52.892 1.758H32.484Z" />
                    </svg>
                </figure>
                <div className="bottom_content">
                    <div className="bottom_inner u-container u-container--pad">
                        <div className="bottom_section -logo">
                            <a className="-sable" href="https://www.sablecapital.co.uk/" target="_blank" aria-label="Sable Capital">
                                <svg className="logo" xmlns="http://www.w3.org/2000/svg" width="140" height="28" fill="none" viewBox="0 0 140 28">
                                    <path fill="#000" d="M9.54 0c2.2 0 4.325.441 6.077 1.064l.745 6.653-.337.11C13.492 2.389 10.883.735 8.31.735 5.738.734 4.248 2.35 4.248 4.85c0 3.49 3.131 4.924 6.448 6.54 3.653 1.763 7.493 3.713 7.493 8.782 0 5.512-4.474 7.828-9.766 7.828-2.497 0-5.218-.514-7.678-1.432L0 19.769l.299-.11c2.908 5.291 5.777 7.605 9.17 7.605s5.032-2.352 5.032-5.033c0-3.49-2.721-5.256-5.777-6.724C4.844 13.632.93 11.796.93 7.019.929 1.947 5.067 0 9.54 0Zm59.415.407c8.05-.036 9.466 3.49 9.467 6.284 0 2.795-1.53 5.33-5.07 6.505 4.809.735 6.485 3.713 6.485 6.761 0 4.188-3.095 7.496-10.846 7.496h-9.802v-.076c1.193-2.278 1.491-3.566 1.491-6.577V7.204c0-3.05-.298-4.3-1.491-6.577V.554c5.441 0 6.747-.147 9.766-.147Zm28.367.22c-1.23 2.278-1.492 3.529-1.492 6.577v19.733l5.628-.22c3.094-.147 5.963-3.529 8.05-6.652l.299.111-1.638 7.276H90.053v-.076c1.193-2.277 1.492-3.564 1.492-6.576V7.204c0-3.05-.299-4.299-1.492-6.577V.554h7.269v.073Zm40.628 6.464-.299.11c-1.974-2.02-4.66-5.769-6.298-5.842l-6.3-.256v12.42h3.205c1.788 0 3.354-2.462 4.623-3.86h.335v8.306h-.335c-1.23-1.287-2.796-3.712-4.623-3.712h-3.205v12.642l6.635-.257c3.057-.148 5.889-3.712 8.012-6.577l.3.111-1.639 7.276v-.002h-19.085v-.073c.97-2.242 1.453-3.674 1.453-6.138V6.761c0-2.5-.485-3.897-1.453-6.139V.55h17.22l1.454 6.54ZM46.59 21.46c1.23 3.197 2.088 4.593 3.392 5.916v.074h-7.419v-.073c.634-1.066.635-3.382-.409-6.101l-1.528-3.968h-8.759l-.783 2.057c-1.678 4.299-.71 6.799.073 8.012v.073h-5.03v-.073c1.788-1.838 2.46-3.49 3.54-6.32L37.683.256h.745L46.59 21.46Zm18.376 4.813c.894.22 2.087.442 3.503.442 4.584 0 6.858-2.645 6.858-6.577l.002-.002c0-3.674-1.825-6.321-5.703-6.321h-4.66v12.458Zm-32.8-9.702h8.163l-4.063-10.62-4.1 10.62ZM68.32 1.137c-1.453 0-2.497.147-3.354.367v11.578h4.324c3.765-.037 5.032-3.27 5.033-6.174 0-3.712-2.162-5.77-6.003-5.77Z" />
                                </svg>
                            </a>
                            {/* <a className="-galliard" href="https://www.galliardhomes.com/wickside" target="_blank" aria-label="Galliard Homes"><svg className="logo" xmlns="http://www.w3.org/2000/svg" width="74" height="53" fill="none" viewBox="0 0 74 53"><path fill="#000" fill-rule="evenodd" d="m72.424.792-9.517 5.506c.11.358.093.713.093.713l9.963-6.26C74.257-.04 73.974 0 73.974 0c-.488.188-1.55.791-1.55.791Zm-5.393 16.123c-.24-.137-.961-.05-1.002.337-.03.28.139.345.328.418.044.017.09.035.134.056.065.03.115.044.162.058.121.034.226.063.529.353.13.123.466-.873-.149-1.222h-.002Zm-39.582 21.96c0 1.346.675 2.344 2.243 2.345.649 0 1.108-.135 1.703-.432l-.243-1.429c-.325.08-.541.08-.677.08-.756 0-1.054-.24-1.054-1.455v-16.13h-1.972v17.021Zm-3.045 2.077-.514-1.242c-.784.755-2.028 1.51-3.92 1.51-2.082 0-3.92-1.48-3.92-3.912 0-2.43 1.758-4.045 5.137-4.152l2.595-.083v-.807c0-1.97-1.081-2.698-2.704-2.698-1.459 0-2.541.567-3.406 1.188l-.811-1.432c1.459-1.023 2.865-1.456 4.433-1.456 2.488 0 4.461 1.053 4.461 4.316v3.885c0 3.614.109 4.476.271 4.883h-1.622Zm-.622-6.124-2.406.08c-2.379.08-3.352.863-3.352 2.346 0 1.215.81 2.266 2.487 2.266 1.678 0 2.677-.835 3.271-1.456v-3.236Zm15.222 18.023V48.4h-5.213v4.45h-1.054v-9.744h1.054v4.303h5.213v-4.303h1.054v9.745l-1.054.001Zm7.396-.725c-.548.561-1.319.872-2.222.872-.904 0-1.63-.296-2.179-.858-.637-.65-.978-1.64-.978-2.795 0-1.154.356-2.114.978-2.765.563-.576 1.319-.902 2.194-.902.874 0 1.66.325 2.222.902.623.65.978 1.612.978 2.765s-.356 2.131-.993 2.781Zm-2.208-5.53c-1.32 0-2.075 1.065-2.075 2.72 0 1.657.785 2.752 2.09 2.752 1.304 0 2.09-1.095 2.09-2.75 0-1.657-.756-2.722-2.105-2.722Zm13.156 1.641v4.614h1.082v-4.984c0-1.67-1.008-2.188-2.075-2.188-.815 0-1.794.458-2.565 1.168-.237-.695-.86-1.168-1.719-1.168-.756 0-1.586.28-2.519 1.02l-.148-.843H48.5v6.995h1.082V47.72c.564-.473 1.289-1.065 2.209-1.065.919 0 1.141.68 1.141 1.612v4.584h1.083v-4.717c0-.133 0-.31-.016-.43.548-.457 1.29-1.049 2.223-1.049.934 0 1.126.651 1.126 1.583Zm3.232 1.301c0 1.332.771 2.53 2.283 2.53.637 0 1.289-.253 1.704-.519l.341.77c-.519.354-1.408.68-2.179.68-2.237 0-3.304-1.79-3.304-3.786s1.155-3.534 2.845-3.534c1.808 0 2.802 1.434 2.802 3.608v.251H60.58Zm1.704-2.942c-1.037 0-1.689.916-1.689 2.026H63.9c0-.975-.549-2.026-1.616-2.026Zm3.324 5.87c.46.267 1.068.533 2.075.533 1.498 0 2.653-.606 2.653-2.07 0-1.255-.972-1.703-1.853-2.109-.728-.336-1.392-.642-1.392-1.352 0-.635.577-.887 1.304-.887.726 0 1.23.207 1.719.414v-.946a4.16 4.16 0 0 0-1.763-.37c-1.601 0-2.328.843-2.328 1.877 0 1.318.94 1.74 1.799 2.127.723.325 1.388.624 1.388 1.407 0 .65-.623 1.036-1.482 1.036a3.24 3.24 0 0 1-1.705-.502l-.415.842ZM34.947 41.22c-1.569 0-2.245-.998-2.245-2.346v-17.02h1.974v16.13c0 1.214.298 1.456 1.055 1.456.135 0 .351 0 .675-.08l.244 1.428c-.595.297-1.055.432-1.703.432Zm3.037-17.072c0 .754.621 1.375 1.378 1.375.757 0 1.378-.62 1.378-1.375s-.623-1.376-1.378-1.376c-.756 0-1.378.622-1.378 1.376Zm.404 4.045v12.76h1.973v-12.76h-1.973Zm11.778 12.76-.514-1.243c-.782.755-2.026 1.51-3.919 1.51-2.081 0-3.92-1.48-3.92-3.912 0-2.43 1.758-4.045 5.136-4.152l2.596-.083v-.807c0-1.97-1.083-2.698-2.704-2.698-1.459 0-2.54.567-3.406 1.188l-.812-1.432c1.46-1.023 2.865-1.456 4.434-1.456 2.486 0 4.459 1.053 4.459 4.316v3.885c0 3.614.109 4.476.272 4.883h-1.622Zm-.623-6.125-2.404.08c-2.38.08-3.354.863-3.354 2.346 0 1.215.812 2.266 2.487 2.266s2.678-.835 3.271-1.456v-3.236Zm8.671-4.882c.485 0 .892.108 1.162.215h.001l.838-1.917c-.243-.159-.73-.376-1.405-.376-.811 0-1.785.19-3.542 1.78l-.27-1.456h-1.623v12.76h1.973v-9.47c1.081-1.023 2.001-1.536 2.866-1.536ZM65.42 8.441c.173-.187.361-1.197-.026-1.395-.118.356-.584 1.027-1.052 1.348 0 0 .76.277 1.078.047Zm1.803 10.896h-.001l.001.001Zm-1.53-.158c.631.746 1.504.176 1.53.16.006.02.051.252-.629.738-.311.223-.761.14-1.178-.102l-.017-.01c-.34-.196-.563-.326-.872-.848-.1-.167-.56-.77-1.045-1.073l-.02-.012-.024-.015-.035-.023c-.18-.093-.405-.214-.692-.37-1.034-.563-2.598-1.412-3.329-1.412-.122 0-.214.024-.273.07l-.012.008c-.097.19-.11 2.002 1.381 3.315.197.175.412.353.636.54l.03.023c1.609 1.333 3.61 2.99 3.046 5.843l-.007.04-.053.025-.03.003c-.116 0-.143-.133-.214-.488v-.002c-.215-1.066-.784-3.89-4.392-5.13a.976.976 0 0 0-.399-.073c-.418 0-.93.163-1.383.308l-.009.002-.001.001c-.336.107-.624.2-.806.2-.102 0-.175-.03-.213-.09l-.019-.029.007-.039c.015-.06.064-.08.303-.17.477-.18 1.469-.556 1.72-1.215.1-.262.069-.55-.091-.854-.453-.863-.419-1.905-.183-2.554.102-.28.235-.466.375-.524a.254.254 0 0 1 .102-.018c.616 0 4.36 1.82 5.022 2.534.16.13.307.277.436.438.312.387.468.414.644.444.042.008.085.015.132.028.348.094.562.331.562.331Zm-19.529-8.075c-.633.416-1.291.96-1.944 1.61-.04.044-2.968 3.254-7.109 5.35h.003c.071.002.141.004.213.004 1.321 0 2.985-.28 5.306-2.356l.494-.44a23.9 23.9 0 0 0 1.729-2.27l.002-.005c.055-.07.984-1.298 1.966-2.222-.203.1-.438.216-.66.33ZM34.733 19.71h.002c.445.103.916.212 1.398.302-.862.242-1.753.366-2.648.37-.713 0-1.161-.09-1.245-.108l-.013-.003c-1.028-.076-1.665-.275-2.019-.43 1.106.01 2.21-.123 3.281-.398.382.066.806.165 1.244.267ZM49.866.94l-.02-.01c-.198-.102-.393-.2-.572-.306.14.17.306.317.488.48.581.52 1.289 1.151 1.516 2.913.312-.638.403-1.166.282-1.602-.199-.718-.959-1.104-1.694-1.477V.94ZM64.037 9.72c-.732.088-1.421-.164-1.641-.288l.004.002c-.213.374-.373 1.064-.385 1.18-.026.243.108.316.259.354l.091.02.02.003.031.006c.273.051.502.194.628.286.506.315.935.814 1.027 1.38.017.038.03.073.037.1-.213-.02-.516.027-.861.08l-.004.001-.038.006-.037.006-.067.01c-.478.1-1.016.186-1.413.02a.778.778 0 0 1-.219-.102.351.351 0 0 1-.041-.036l-.02-.019c.275-.09.56-.252.784-.378.181-.102.322-.182.387-.184-.137-.784-1.096-1.067-1.692-.882-.056-.287-.121-.546-.253-.714-.301-.384-1.573-.344-2.432.073-.475.231-2.575 1.666-3.698 2.855-1.279 1.495-2.874 3.526-3.35 4.865a.77.77 0 0 1-.069-.275c-.042-.518.247-1.786 2.654-4.446.337-.336.676-.997.658-1.518-.007-.226-.079-.4-.214-.518-.18-.158-.46-.283-.73-.405l-.011-.005c-.244-.11-.566-.256-.584-.358.117-.037.625.09 1.041.194l.01.002.004.001c.611.153 1.302.325 1.754.303.042-.005.082-.008.122-.01.316-.027.643-.054 1.966-.72 1.288-.648 2.901-1.828 2.917-1.84l.025-.029c.314-.643 1.241-2.35 1.737-2.518a.183.183 0 0 1 .059-.012c-.031.283.021.562.072.833.064.347.125.674.019.99l-.036.091c.28.01.547.133.849.273.577.268 1.282.595 2.448.298.057.116-.969.924-1.808 1.025Zm-6.061-.863c-.702.41-1.498.876-2.804.876-.462 0-.965-.06-1.501-.18.721.53 1.422.786 2.135.786 1.171 0 2.164-.722 2.962-1.302l.004-.003.01-.007c.405-.295.763-.555 1.093-.694a1.834 1.834 0 0 0-.386-.042c-.547 0-.995.263-1.513.566Zm-.74-.29.004-.002c.174-.084.326-.155.486-.155.1 0 .197.03.295.088-.14.037-.297.137-.475.25l-.008.005c-.295.188-.63.401-.997.401-.373 0-.713-.223-1.041-.683.351.21.667.31.965.31.314 0 .556-.114.771-.214Zm9.848 6.78h.003l.003.002.016.006c.037-.293-1.379-2.662-2.028-3.546.119.67.599 2.794 2.006 3.537Zm-3.09 1.694c-.854-.467-2.82-1.785-2.942-2.052h.012c1.387.063 2.562 1.54 2.93 2.052ZM52.46 6.676l-.19-1.682a.119.119 0 0 0-.159.02l.209 1.843c-.245.142-.854.193-1.519.25-.912.075-1.929.16-2.254.502 0 0 1.255-.026 2.295-.06l.168.18c.34.15.391.13.453.104a.271.271 0 0 1 .059-.018c.07-.012.154-.177.209-.303.168-.01.301-.018.383-.027l.155.467-.268 1.972s-1.75-.063-2.395-.6c0 0 .099.784 2.299.92.119.005.266-.014.321-.13l.077-.453.515-2.31c.544-.165 1.009-.453-.36-.675h.002Zm-.153-2.632c.009.088-.078.182-.235.271a1.979 1.979 0 0 0-.405-.109c.07-.144.131-.283.182-.419.275.053.446.141.458.257Zm-1.822.147c.126-.015.25-.024.37-.03a6.451 6.451 0 0 0-.061-.422 8.19 8.19 0 0 0-.409.034c-1.033.115-1.851.422-1.825.687.01.1.145.182.364.236.31-.23.886-.428 1.561-.505Zm-1.033-2.68.127.013c.334.302.679.65.936 1.25-.417-.344-.828-.5-1.213-.645-.577-.218-1.094-.413-1.479-1.192.242.445.902.506 1.629.574ZM36.139 18.6c-.376-.038-.754-.06-1.132-.066-.413 0-.879.036-1.383.228.426.067.896.176 1.408.295l.016.004.01.002c.981.23 2.092.487 3.159.487 1.89 0 3.199-.834 4.053-2.608-2.026 1.517-3.597 1.733-4.775 1.733-.478 0-.925-.038-1.356-.075ZM13.82 32.373h.887v7.445c-.973.54-3.109 1.402-5.731 1.402C3.732 41.22 0 37.93 0 32.373c0-5.556 3.732-9.332 9.246-9.33 2.217 0 4.11.621 5.002 1.078v2.131c-1.109-.593-2.947-1.375-5.056-1.375-4.488 0-7.083 2.94-7.083 7.2 0 4.585 2.785 7.31 7.218 7.31 1.65 0 2.731-.325 3.407-.729v-4.317h-2.199v-1.968h3.285Zm45.403 2.374c0 4.397 3.001 6.473 6.57 6.473 1.811 0 3.298-.457 4.082-.917V21.854h-1.973v6.232c-.514-.137-1.164-.218-2.082-.218-3.731 0-6.597 2.913-6.597 6.88Zm6.707-5.152c.999 0 1.458.135 1.972.323v9.306c-.406.19-1.109.325-1.758.325-3.324 0-4.92-2.05-4.92-4.937 0-3.048 2.191-5.017 4.706-5.017Z" clip-rule="evenodd"/></svg></a> --> */}
                        </div>
                        <div className="bottom_section -copyright">
                            <ul className='copyright_menu'>
                                <li className='menu_item'>
                                    <a className="item_link" href="/terms-and-conditions/" aria-label="Terms" target="_self" data-cursor="default" data-split="" data-split-color="#e2d9d3">Terms</a>
                                </li>
                                <li className='menu_item'>
                                    <a className="item_link" href="/privacy-policy/" aria-label="Privacy" target="_self" data-cursor="default" data-split="" data-split-color="#e2d9d3">Privacy</a>
                                </li>
                            </ul>
                            © 2025 Wickside. All rights reserved
                        </div>
                        <div className="bottom_section -credit">
                            <a href="https://societystudios.co.uk/" target="_blank" aria-label="Website by Society Studios">
                                SITE BY
                                <svg className="credit_logo" xmlns="http://www.w3.org/2000/svg" width="118" height="11" fill="none" viewBox="0 0 118 11">
                                    <path fill="#10162D" d="M77.548 7.025c0 1.464.796 2.29 2.138 2.29 1.34 0 2.125-.827 2.125-2.29V.746h1.324v6.322c0 2.26-1.503 3.476-3.45 3.476-1.946 0-3.45-1.216-3.45-3.48V.745h1.313v6.28ZM12.846.542c2.409 0 4.816 1.787 4.816 4.991 0 3.205-2.407 5.009-4.816 5.009-2.41 0-4.816-1.798-4.816-5.009 0-3.211 2.41-4.99 4.816-4.991Zm90.244 0c2.409 0 4.816 1.787 4.816 4.991 0 3.205-2.407 5.009-4.816 5.009s-4.816-1.798-4.816-5.009c0-3.211 2.409-4.99 4.816-4.991ZM63.129.54c2.162 0 3.03 1.342 3.246 2.379l-1.19.419c-.11-.689-.69-1.633-2.029-1.633-1.083 0-1.85.7-1.85 1.593 0 .689.419 1.217 1.226 1.396l1.432.312c1.592.354 2.49 1.353 2.491 2.69 0 1.486-1.269 2.842-3.312 2.842-2.313 0-3.407-1.486-3.583-2.852l1.27-.409c.097 1.066.85 2.056 2.299 2.056 1.323 0 1.976-.69 1.977-1.528 0-.69-.474-1.29-1.432-1.487l-1.365-.3c-1.366-.301-2.342-1.192-2.342-2.625 0-1.504 1.395-2.853 3.162-2.853Zm49.361 0c2.162 0 3.031 1.342 3.246 2.379l-1.19.419c-.109-.689-.689-1.633-2.028-1.633-1.084 0-1.851.7-1.851 1.593 0 .689.419 1.217 1.227 1.396l1.431.312c1.592.354 2.491 1.353 2.491 2.69 0 1.486-1.269 2.842-3.312 2.842-2.313 0-3.407-1.486-3.582-2.852l1.269-.409c.097 1.066.851 2.056 2.299 2.056 1.323 0 1.977-.69 1.977-1.528 0-.69-.474-1.29-1.432-1.487l-1.365-.3c-1.366-.301-2.342-1.192-2.342-2.625 0-1.504 1.395-2.853 3.162-2.853ZM3.57.542C5.73.542 6.6 1.884 6.815 2.921l-1.19.42h-.003c-.108-.69-.688-1.637-2.03-1.637-1.083 0-1.85.7-1.85 1.594 0 .689.42 1.216 1.227 1.395l1.431.313c1.593.354 2.492 1.353 2.492 2.69 0 1.486-1.27 2.841-3.313 2.841-2.312.007-3.407-1.485-3.582-2.851l1.27-.41c.096 1.066.85 2.056 2.298 2.056 1.324 0 1.977-.689 1.977-1.528 0-.69-.474-1.288-1.432-1.486l-1.365-.3C1.376 5.724.404 4.83.404 3.392c0-1.439 1.394-2.85 3.165-2.85Zm20.087 0c2.192 0 3.733 1.192 4.224 3.043l-1.233.43c-.366-1.449-1.421-2.26-2.989-2.26-1.742.001-3.406 1.272-3.406 3.776 0 2.504 1.664 3.788 3.406 3.788 1.635 0 2.666-.99 3.056-2.3l1.173.43c-.516 1.798-2.03 3.086-4.235 3.086-2.467.007-4.755-1.797-4.755-5.004l-.003.002c0-3.204 2.385-4.99 4.762-4.991Zm15.44 1.438h-4.503v2.95h4.085v1.245h-4.085V9.11h4.504v1.235H33.27V.746h5.828V1.98Zm-8.157 8.36h-1.352V.746h1.352v9.594Zm17.002-8.36h-3.21v8.36H43.41V1.974h-3.205V.746h7.738V1.98Zm27.073 0h-3.21v8.36H70.48V1.974h-3.205V.746h7.739V1.98ZM88.772.746c2.43 0 4.557 1.666 4.557 4.818 0 3.153-2.151 4.776-4.587 4.776h-3.324V.746h3.353Zm7.72 9.594h-1.353V.746h1.352v9.594ZM53.447 6.235v4.098h-1.323V6.239L48.74.746h1.593l2.492 4.273 2.491-4.28h1.517l-3.385 5.496ZM12.846 1.763c-1.783 0-3.461 1.27-3.461 3.774 0 2.498 1.678 3.788 3.46 3.788 1.786 0 3.462-1.288 3.462-3.788s-1.678-3.774-3.461-3.774Zm90.244 0c-1.783 0-3.46 1.27-3.461 3.774 0 2.504 1.678 3.788 3.461 3.788 1.785 0 3.461-1.288 3.461-3.788s-1.678-3.774-3.461-3.774ZM86.737 9.166H88.7c1.772 0 3.26-1.191 3.26-3.602 0-2.41-1.463-3.637-3.234-3.637h-1.988v7.239ZM117.208.542c.437 0 .789.36.789.797a.795.795 0 0 1-.789.797.792.792 0 0 1-.785-.797.79.79 0 0 1 .785-.797Zm0 .155a.616.616 0 0 0-.617.635c0 .359.276.642.617.642a.622.622 0 0 0 .617-.642.612.612 0 0 0-.617-.635Zm.038.2c.168 0 .294.119.294.269a.272.272 0 0 1-.19.258l.19.337h-.186l-.18-.323h-.065v.33l-.002-.003h-.162V.896h.301Zm-.139.4h.115c.096 0 .15-.046.15-.124 0-.083-.054-.133-.15-.133h-.115v.258Z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer