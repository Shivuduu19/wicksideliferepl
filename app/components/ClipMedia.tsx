import React from 'react'
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

type PatternConfig = {
    shapeDefault: gsap.SVGPathValue | null;
    shapeMobile: gsap.SVGPathValue | null;
    element: SVGImageElement;
};
const ClipMedia = () => {
    const rootRef = useRef<HTMLElement>(null);
    const resizeHandlerRef = useRef<NodeJS.Timeout | null>(null);
    const timers = useRef<number[]>([]);

    const addTimer = (id: number) => timers.current.push(id);
    const clearAllTimers = () => timers.current.forEach(t => clearTimeout(t));

    useLayoutEffect(() => {
        if (!rootRef.current) return;
        const root = rootRef.current;

        const options = {
            patternDuration: 2,
            imageFadeDuration: 0.8,
            delayBetween: 1,
            ease: "expo.inOut",
        };

        const images = Array.from(
            root.querySelectorAll<SVGImageElement>("image")
        );

        const stickers = Array.from(
            root.querySelectorAll<HTMLElement>(".sticker")
        );

        // ✅ Converts DOM to config list
        const getConfigs = (): PatternConfig[] =>
            images.map((img) => ({
                shapeDefault: img.getAttribute("data-shape-default"),
                shapeMobile: img.getAttribute("data-shape-mobile"),
                element: img,
            }));

        const getCurrentShape = (conf: PatternConfig) =>
            window.innerWidth < 641 ? conf.shapeMobile : conf.shapeDefault;

        const getCurrentPathSelector = () =>
            window.innerWidth < 641
                ? `#${root.id}_path--mobile`
                : `#${root.id}_path--default`;

        /** ✅ Morph + Fade Loop */
        const animatePatterns = (configs: PatternConfig[]) => {
            let index = 0;
            // console.log(configs);


            const cycle = () => {
                const next = (index + 1) % configs.length;
                const currentConf = configs[index];
                const nextConf = configs[next];

                const path = getCurrentPathSelector();

                // Morph the SVG path shape
                // console.log(typeof getCurrentShape(nextConf))

                gsap.to(path, {
                    duration: 2,
                    morphSVG: `${getCurrentShape(nextConf)}`,
                    ease: options.ease,
                });

                // Fade images
                const curImg = currentConf.element;
                const nextImg = nextConf.element;
                const delayStart =
                    (options.patternDuration - options.imageFadeDuration) * 0.5;
                // console.log(delayStart);


                gsap.to(nextImg, {
                    duration: options.imageFadeDuration,
                    opacity: 1,
                    delay: delayStart,
                    ease: options.ease,
                });

                gsap.to(curImg, {
                    duration: options.imageFadeDuration,
                    opacity: 0,
                    delay: delayStart + options.imageFadeDuration * 0.3,
                    ease: options.ease,
                });

                // console.log(next);

                addTimer(window.setTimeout(() => {
                    index = next;
                    addTimer(
                        window.setTimeout(() => {
                            cycle()
                        }, options.delayBetween * 1000));

                }, options.patternDuration * 1000));
            };

            const id = window.setTimeout(cycle, options.delayBetween * 1000);
            addTimer(id);
        };

        /** ✅ Sticker scroll animations */
        const initStickerAnimations = () => {
            stickers.forEach((s) => {
                const text = s.querySelector(".sticker_text");
                const flap = s.querySelector(".sticker_flap");
                if (!text || !flap) return;

                gsap.timeline({
                    scrollTrigger: {
                        trigger: s,
                        start: "top 80%",
                        end: "bottom 20%",
                        once: true,
                    },
                })
                    .to(flap, {
                        duration: 0.8,
                        scale: "1.08, 1.16",
                        translateY: 0,
                        opacity: 1,
                        ease: "expo.inOut",
                    })
                    .set(text, { opacity: 1 }, "-=0.1")
                    .to(flap, {
                        duration: 0.6,
                        scaleY: 0,
                        scaleX: 1.02,
                        translateY: 10,
                        ease: "power4.out",
                    });
            });
        };

        const configs = getConfigs();
        initStickerAnimations();
        animatePatterns(configs);

        /** ✅ Handle Resize */
        const debouncedResize = () => {
            ScrollTrigger.refresh();
            animatePatterns(getConfigs());
        };

        const resizeListener = () => {
            clearTimeout(resizeHandlerRef.current as any);
            resizeHandlerRef.current = setTimeout(debouncedResize, 250);
        };

        window.addEventListener("resize", resizeListener);

        /** ✅ Cleanup */
        return () => {
            window.removeEventListener("resize", resizeListener);
            clearAllTimers();
        };
    }, []);



    return (
        <section ref={rootRef} data-cid="text-wi-clipmedia" data-js data-js-loaded="false" data-js-mounted="false" id="block_3632868874c50d1f6c5274c005bba3b2" className="block-text-wi-clipmedia  -offset-block-rtl-ltr -parent-offset c-text-wi-clipmedia u-default" style={{ "--block-color-text": "#10162d" } as React.CSSProperties}>
            <div className="block_inner u-container u-container--pad">
                <aside className="content column">
                    <div className="content_inner inview-trigger">
                        <div className="heading inview-element u-wysiwyg-text--1">
                            <p>
                                Start your<br />
                                journey at<br />
                                <span className="sticker js-sticker" role="button" aria-label="Wickside" style={{ "--sticker-text-color": "#7ce0f6", "--sticker-bg-color": "#9786fa" } as React.CSSProperties}>
                                    <span className="sticker_text">Wickside</span>
                                    <span className="sticker_flap"></span>
                                </span>
                            </p>
                        </div>
                        <h5 className="text inview-element u-wysiwyg-text--1 u-wysiwyg-lists--1">
                            <p>Thoughtfully designed rental homes by the canal, where every detail serves a purpose &#8211;from light-filled interiors to rooftop gardens to wellbeing and fitness facilities. Wickside is where the past holds, creativity leads, and community grows. Designed with intention. Alive with possibility.</p>
                        </h5>
                        <div className="button inview-element">
                            <a className="u-btn--1 -outline button_el" href="/register/" aria-label="Let’s talk" target="_self" style={{ "--button-color-text": "#10162d", "--button-color-background": "#10162d", "--button-color-text-hover": "#ffffff", "--button-color-background-hover": "#10162d" } as React.CSSProperties}>
                                <span className="btn_label">Let’s talk</span>
                            </a>
                        </div>
                    </div>
                </aside>
                <aside className="media column">
                    <div className="media_inner">
                        <svg className="mask-svg" viewBox="0 0 680 482">
                            <defs>
                                <mask id="block_3632868874c50d1f6c5274c005bba3b2_mask">
                                    <path id="block_3632868874c50d1f6c5274c005bba3b2_path--default" className="mask-path--default" fill="white" d="m300.448 0 29.529 81.165 105.064-5.296 40.414 97.545-38.792 21.069 188.061-8.502L651 289.226l-254.104 76.201 100.965 10.882L480.649 482l-363.586-39.206-14.048-102.856 100.577-30.162-39.18-95.577 36.255-19.7-137.798 6.947-20.266-64.655-24.575 2.786L0 33.975 300.448 0Z" />
                                    <path id="block_3632868874c50d1f6c5274c005bba3b2_path--mobile" className="mask-path--mobile" fill="white" d="m274.352 476-36.848-37.587-63.065-10.357-8.826-38.516-63.132 33.04L30.1 324.552l104.846-105.838-91.058 33.784L1 136.883 353.746 6l65.242 101.208-21.745 21.948 74.87-39.177 64.068 105.049-201.394 141.753 310.765-67.136L680 387.727 274.352 476Z" />
                                </mask>
                            </defs>
                            <g mask="url(#block_3632868874c50d1f6c5274c005bba3b2_mask)">
                                <image href="https://mlk2eo8xdoqk.i.optimole.com/w:891/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/WICKSIDE_VIEW_6_DUSK_update-scaled.jpg" x="0" y="0" width="680" height="482" opacity="1" preserveAspectRatio="xMidYMid slice" data-shape-default="m300.448 0 29.529 81.165 105.064-5.296 40.414 97.545-38.792 21.069 188.061-8.502L651 289.226l-254.104 76.201 100.965 10.882L480.649 482l-363.586-39.206-14.048-102.856 100.577-30.162-39.18-95.577 36.255-19.7-137.798 6.947-20.266-64.655-24.575 2.786L0 33.975 300.448 0Z" data-shape-mobile="m274.352 476-36.848-37.587-63.065-10.357-8.826-38.516-63.132 33.04L30.1 324.552l104.846-105.838-91.058 33.784L1 136.883 353.746 6l65.242 101.208-21.745 21.948 74.87-39.177 64.068 105.049-201.394 141.753 310.765-67.136L680 387.727 274.352 476Z" />
                                <image href="https://mlk2eo8xdoqk.i.optimole.com/w:1402/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/WICKSIDE_VIEW_2-scaled.jpg" x="0" y="0" width="680" height="482" opacity="0" preserveAspectRatio="xMidYMid slice" data-shape-default="M519 358.133 74.43 482l-43.448-85.756 101.384-66.627-35.89-83.072 26.481-13.884-11.983-60.739-94.494 22.462L0 97.506 410.171 0l33.443 90.652-122.667 62.344 4.897 23.594 82.889-24.747 44.803 85.367-81.502 60.287 124.832-34.783L519 358.133Z" data-shape-mobile="m274.352 476-36.848-37.587-63.065-10.357-8.826-38.516-63.132 33.04L30.1 324.552l104.846-105.838-91.058 33.784L1 136.883 353.746 6l65.242 101.208-21.745 21.948 74.87-39.177 64.068 105.049-201.394 141.753 310.765-67.136L680 387.727 274.352 476Z" />
                                <image href="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View07_160331-scaled.jpg" x="0" y="0" width="680" height="482" opacity="0" preserveAspectRatio="xMidYMid slice" data-shape-default="m274.352 476-36.848-37.587-63.065-10.357-8.826-38.516-63.132 33.04L30.1 324.552l104.846-105.838-91.058 33.784L1 136.883 353.746 6l65.242 101.208-21.745 21.948 74.87-39.177 64.068 105.049-201.394 141.753 310.765-67.136L680 387.727 274.352 476Z" data-shape-mobile="m274.352 476-36.848-37.587-63.065-10.357-8.826-38.516-63.132 33.04L30.1 324.552l104.846-105.838-91.058 33.784L1 136.883 353.746 6l65.242 101.208-21.745 21.948 74.87-39.177 64.068 105.049-201.394 141.753 310.765-67.136L680 387.727 274.352 476Z" />
                            </g>
                        </svg>
                    </div>
                </aside>
            </div>
            <div className="block_offset"></div>
        </section>
    )
}

export default ClipMedia