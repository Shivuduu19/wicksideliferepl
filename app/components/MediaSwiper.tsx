import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

type Props = {
    debug?: boolean;
    dividerColors?: string[];
    parallax?: { from: number; to: number };
};

export default function MediaSwiperFromHTML({
    debug = false,
    dividerColors = ["var(--color--1)", "var(--color--2)", "var(--color--4)", "var(--color--5)", "var(--color--7)"],
    parallax = { from: -25, to: 0 },
}: Props) {
    const rootRef = useRef<HTMLElement | null>(null);
    const prevBtnRef = useRef<HTMLButtonElement | null>(null);
    const nextBtnRef = useRef<HTMLButtonElement | null>(null);
    const paginationRef = useRef<HTMLElement | null>(null);
    const arrowRef = useRef<HTMLElement | null>(null);

    // mutable state container
    const st = useRef({
        current: 0,
        slides: [] as HTMLElement[],
        slidesInner: [] as HTMLElement[],
        slidesWrapper: null as HTMLElement | null,
        divider: null as HTMLElement | null,
        slidesTotal: 0,
        isAnimating: false,
        lastDividerColor: null as string | null,
        isMouseTracking: false,
        mouseTween: null as GSAPTween | null,
        rotationTween: null as GSAPTween | null,
        flipTween: null as GSAPTween | null,
        currentRotation: 0,
        isFlipped: false,
        hasFinePointer: false,
        tl: null as GSAPTimeline | null,
        slidesParallaxTimeline: null as GSAPTimeline | null,
    });

    const getRandomDividerColor = () => {
        const options = dividerColors.filter(c => c !== st.current.lastDividerColor);
        const pick = options[Math.floor(Math.random() * options.length)] || dividerColors[0];
        st.current.lastDividerColor = pick;
        return pick;
    };

    const updatePagination = (n: number) => {
        const el = paginationRef.current;
        if (!el) return;
        gsap.to(el, {
            duration: 0.2,
            opacity: 0,
            x: -3,
            ease: "power2.in",
            onComplete: () => {
                el.textContent = String(n);
                gsap.fromTo(el, { opacity: 0, x: 3 }, { duration: 0.2, opacity: 1, x: 0, ease: "power2.out" });
            },
        });
    };

    const navigate = (dir: 1 | -1) => {
        if (st.current.isAnimating) return;
        st.current.isAnimating = true;

        const prevIndex = st.current.current;
        const total = st.current.slidesTotal;
        const nextIndex = dir === 1 ? (prevIndex < total - 1 ? prevIndex + 1 : 0) : (prevIndex > 0 ? prevIndex - 1 : total - 1);
        st.current.current = nextIndex;

        updatePagination(nextIndex + 1);

        const sPrev = st.current.slides[prevIndex];
        const sPrevInner = st.current.slidesInner[prevIndex];
        const sNext = st.current.slides[nextIndex];
        const sNextInner = st.current.slidesInner[nextIndex];
        const divider = st.current.divider;

        sNext.classList.add("is-current");

        const tl = gsap.timeline({
            defaults: { duration: 1 },
            onComplete: () => {
                sPrev.classList.remove("is-current");
                st.current.isAnimating = false;
            },
        });

        tl.addLabel("start", 0)
            .to(sPrev, { duration: 0.3, ease: "power2.in", xPercent: -dir * 100 }, "start")
            .to(sPrevInner, { duration: 0.3, ease: "power2.in", xPercent: dir * 75, rotation: -dir * 6, scale: 1.15 }, "start")
            .fromTo(divider, { xPercent: dir * 100, autoAlpha: 1 }, { duration: 0.3, ease: "power2.in", xPercent: 0 }, "start")
            .to(divider, { ease: "power4", xPercent: -dir * 100, onComplete: () => { if (divider) divider.style.background = getRandomDividerColor(); } }, "start+=0.2")
            .addLabel("middle", "<")
            .fromTo(sNext, { autoAlpha: 1, xPercent: dir * 100 }, { ease: "power4", xPercent: 0 }, "middle")
            .fromTo(sNextInner, { xPercent: -dir * 75, rotation: dir * 6, scale: 1.15 }, { ease: "power4", xPercent: 0, rotation: 0, scale: 1 }, "middle");

        st.current.tl = tl;
    };

    const next = () => navigate(1);
    const prev = () => navigate(-1);

    // arrow / mouse tracking helpers
    const updateArrowPosition = (e: MouseEvent) => {
        const el = arrowRef.current;
        const block = rootRef.current;
        if (!el || !block) return;
        const rect = block.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const nx = e.clientX - rect.left - cx;
        const ny = e.clientY - rect.top - cy;
        const a = rect.width / 2;
        const b = rect.height / 2;
        const dx = Math.max(-a, Math.min(a, nx));
        const dy = Math.max(-b, Math.min(b, ny));

        st.current.mouseTween && st.current.mouseTween.kill();
        st.current.rotationTween && st.current.rotationTween.kill();

        const h = (nx / a) * 30;
        let rot = ny < 0 ? Math.abs(h) : -Math.abs(h);
        if (st.current.isFlipped) rot = -rot;

        st.current.mouseTween = gsap.to(el, { duration: 0.4, ease: "power2.out", x: dx, y: dy });
        st.current.rotationTween = gsap.to(el, { duration: 0.4, ease: "power2.out", rotation: rot, onUpdate: () => { st.current.currentRotation = rot; } });
    };

    const flipArrow = (f: boolean) => {
        const el = arrowRef.current;
        if (!el) return;
        st.current.flipTween && st.current.flipTween.kill();
        st.current.isFlipped = f;
        st.current.flipTween = gsap.to(el, { duration: 0.3, ease: "power2.out", scaleX: f ? -1 : 1 });
    };

    const startMouseTracking = () => { st.current.isMouseTracking = true; };
    const stopMouseTracking = () => {
        st.current.isMouseTracking = false;
        st.current.mouseTween && st.current.mouseTween.kill();
        st.current.rotationTween && st.current.rotationTween.kill();
        const el = arrowRef.current;
        if (!el) return;
        st.current.mouseTween = gsap.to(el, { duration: 0.6, ease: "power3.out", x: 0, y: 0 });
        st.current.rotationTween = gsap.to(el, { duration: 0.6, ease: "power3.out", rotation: st.current.currentRotation });
    };




    useGSAP(
        () => {
            const root = rootRef.current!;
            const slidesEl = root.querySelector<HTMLElement>(".slides")!;

            st.current.slides = Array.from(root.querySelectorAll<HTMLElement>(".slide"));
            st.current.slidesInner = st.current.slides.map(s =>
                s.querySelector<HTMLElement>(".slide_img")!
            );
            st.current.divider = root.querySelector<HTMLElement>(".divider");
            st.current.slidesWrapper = root.querySelector<HTMLElement>(".slides_wrapper");
            st.current.slidesTotal = st.current.slides.length;

            // ✅ Initial slide setup
            if (st.current.slidesTotal > 0) {
                st.current.slides[st.current.current].classList.add("is-current");
                const pag = root.querySelector<HTMLElement>(".pagination_current");
                if (pag) {
                    paginationRef.current = pag;
                    updatePagination(st.current.current + 1);
                }
            }

            // ✅ Fine pointer detection
            const fine = window.matchMedia("(pointer: fine)");
            const hover = window.matchMedia("(hover: hover)");
            st.current.hasFinePointer = fine.matches && hover.matches;

            // ✅ Parallax scroll effect
            if (st.current.slidesWrapper) {
                st.current.slidesParallaxTimeline = gsap.timeline({
                    scrollTrigger: {
                        trigger: root,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    },
                    defaults: { ease: "none" }
                });

                st.current.slidesParallaxTimeline.fromTo(
                    st.current.slidesWrapper,
                    { yPercent: parallax.from },
                    { yPercent: parallax.to },
                    0
                );
            }

            // ✅ Prev / Next click control setup
            prevBtnRef.current = root.querySelector(".controls_btn.-prev")!;
            nextBtnRef.current = root.querySelector(".controls_btn.-next")!;
            prevBtnRef.current?.addEventListener("click", prev);
            nextBtnRef.current?.addEventListener("click", next);

            // ✅ Keyboard navigation
            const keyHandler = (ev: KeyboardEvent) => {
                if (ev.key === "ArrowLeft") {
                    ev.preventDefault();
                    prev();
                }
                if (ev.key === "ArrowRight") {
                    ev.preventDefault();
                    next();
                }
            };
            document.addEventListener("keydown", keyHandler);

            // ✅ Swipe gesture support
            if ("observe" in ScrollTrigger) {
                ScrollTrigger.observe({
                    target: root,
                    type: "touch,pointer",
                    onLeft: () => next(),
                    onRight: () => prev(),
                    tolerance: 10
                });
            }

            // ✅ Mouse tracking Arrow feature
            arrowRef.current = root.querySelector(".arrow_el");
            if (st.current.hasFinePointer && arrowRef.current) {
                const enter = () => startMouseTracking();
                const leave = () => stopMouseTracking();
                const move = (ev: MouseEvent) => {
                    if (st.current.isMouseTracking) updateArrowPosition(ev);
                };

                root.addEventListener("mouseenter", enter);
                root.addEventListener("mouseleave", leave);
                root.addEventListener("mousemove", move);

                const prevHover = root.querySelector(".controls_btn.-prev");
                const nextHover = root.querySelector(".controls_btn.-next");

                prevHover?.addEventListener("mouseenter", () => flipArrow(true));
                prevHover?.addEventListener("mouseleave", () => flipArrow(false));

                nextHover?.addEventListener("mouseenter", () => flipArrow(false));
                nextHover?.addEventListener("mouseleave", () => flipArrow(false));
            }

            // ✅ Set divider initial color
            if (st.current.divider) {
                st.current.divider.style.background = getRandomDividerColor();
            }

            // ✅ CLEANUP handled automatically by useGSAP context
            return () => {
                // ScrollTrigger.getAll().forEach(st => st.kill());
                st.current.mouseTween?.kill();
                st.current.rotationTween?.kill();
                st.current.flipTween?.kill();
                // st.current.tl?.kill();
                // st.current.slidesParallaxTimeline?.kill();
                document.removeEventListener("keydown", keyHandler);
            };
        },
        {
            scope: rootRef,
            dependencies: [dividerColors.join("|"), parallax.from, parallax.to, debug]
        }
    );



    // useEffect(() => {
    //     if (!rootRef.current) return;
    //     const ctx = gsap.context(() => {
    //         const root = rootRef.current!;
    //         const slidesEl = root.querySelector<HTMLElement>(".slides")!;
    //         st.current.slides = Array.from(root.querySelectorAll<HTMLElement>(".slide"));
    //         st.current.slidesInner = st.current.slides.map(s => s.querySelector<HTMLElement>(".slide_img") as HTMLElement);
    //         st.current.divider = root.querySelector<HTMLElement>(".divider");
    //         st.current.slidesWrapper = root.querySelector<HTMLElement>(".slides_wrapper");
    //         st.current.slidesTotal = st.current.slides.length;

    //         // initial state
    //         if (st.current.slides.length) {
    //             st.current.slides[st.current.current].classList.add("is-current");
    //             const pag = root.querySelector<HTMLElement>(".pagination_current");
    //             if (pag) { paginationRef.current = pag; updatePagination(st.current.current + 1); }
    //         }

    //         // pointer capability
    //         const fine = window.matchMedia("(pointer: fine)");
    //         const hover = window.matchMedia("(hover: hover)");
    //         st.current.hasFinePointer = fine.matches && hover.matches;

    //         // slides parallax on scroll
    //         if (st.current.slidesWrapper && typeof ScrollTrigger !== "undefined") {
    //             st.current.slidesParallaxTimeline = gsap.timeline({
    //                 scrollTrigger: {
    //                     trigger: root,
    //                     start: "top bottom",
    //                     end: "bottom top",
    //                     scrub: true,
    //                 },
    //                 defaults: { ease: "none" },
    //             });
    //             st.current.slidesParallaxTimeline.fromTo(st.current.slidesWrapper, { yPercent: parallax.from }, { yPercent: parallax.to }, 0);
    //         }

    //         // controls (if present)
    //         const prevBtn = root.querySelector<HTMLButtonElement>(".controls_btn.-prev");
    //         const nextBtn = root.querySelector<HTMLButtonElement>(".controls_btn.-next");
    //         if (prevBtn) { prevBtnRef.current = prevBtn; prevBtn.addEventListener("click", prev); }
    //         if (nextBtn) { nextBtnRef.current = nextBtn; nextBtn.addEventListener("click", next); }

    //         // keyboard nav
    //         const keyHandler = (ev: KeyboardEvent) => {
    //             if (ev.key === "ArrowLeft") { ev.preventDefault(); prev(); }
    //             if (ev.key === "ArrowRight") { ev.preventDefault(); next(); }
    //         };
    //         document.addEventListener("keydown", keyHandler);

    //         // swipe gestures via ScrollTrigger.observe
    //         if (typeof ScrollTrigger !== "undefined" && "observe" in ScrollTrigger) {
    //             ScrollTrigger.observe({
    //                 target: root,
    //                 type: "touch,pointer",
    //                 onLeft: () => next(),
    //                 onRight: () => prev(),
    //                 tolerance: 10,
    //             });
    //         }

    //         // mouse tracking arrow and flips
    //         const arrowEl = root.querySelector<HTMLElement>(".arrow_el");
    //         if (arrowEl) arrowRef.current = arrowEl;
    //         if (st.current.hasFinePointer && arrowEl) {
    //             const enter = () => startMouseTracking();
    //             const leave = () => stopMouseTracking();
    //             const move = (ev: MouseEvent) => { if (st.current.isMouseTracking) updateArrowPosition(ev); };

    //             root.addEventListener("mouseenter", enter);
    //             root.addEventListener("mouseleave", leave);
    //             root.addEventListener("mousemove", move);

    //             const prevHover = root.querySelector<HTMLElement>(".controls_btn.-prev");
    //             const nextHover = root.querySelector<HTMLElement>(".controls_btn.-next");
    //             if (prevHover) { prevHover.addEventListener("mouseenter", () => flipArrow(true)); prevHover.addEventListener("mouseleave", () => flipArrow(false)); }
    //             if (nextHover) { nextHover.addEventListener("mouseenter", () => flipArrow(false)); nextHover.addEventListener("mouseleave", () => flipArrow(false)); }
    //         }

    //         // ensure divider initial color
    //         if (st.current.divider) st.current.divider.style.background = getRandomDividerColor();

    //     }, rootRef);

    //     return () => {
    //         ctx.revert();
    //         // kill ScrollTriggers
    //         ScrollTrigger.getAll().forEach(stg => stg.kill());
    //         // kill tweens
    //         st.current.mouseTween && st.current.mouseTween.kill();
    //         st.current.rotationTween && st.current.rotationTween.kill();
    //         st.current.flipTween && st.current.flipTween.kill();
    //         st.current.tl && st.current.tl.kill();
    //         st.current.slidesParallaxTimeline && st.current.slidesParallaxTimeline.kill();
    //         // remove key handler (bound above)
    //         document.removeEventListener("keydown", () => { });
    //     };
    // }, [dividerColors.join("|"), parallax.from, parallax.to, debug]);


    return (
        <section
            data-cid="media-swiper"
            data-js=""
            data-js-loaded="false"
            data-js-mounted="false"
            id="block_dd9aad6785a736025ff91d29a5a37e11"
            className="block-media-swiper -offset-block-end-ltr c-media-swiper u-default"
            ref={rootRef as any}
        >
            <div className="block_inner" style={{ paddingBlock: "clamp(0.00px, calc(0.00px + 0.00000cqw), 0.00px)" }}>
                <div className="slides" data-cursor="hidden">
                    <div className="slides_wrapper">

                        <div className="slide">
                            <img

                                decoding="async"
                                src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:mauto/f:best/dpr:2/https://wicksidelife.com/wp-content/uploads/2025/07/WICKSIDE_VIEW_8-2-scaled.jpg"
                                sizes="(max-width: 1000px) 100vw, 1000px"
                                alt=""
                                loading="lazy"
                                className="slide_img u-cover-object"
                                style={{ objectPosition: "50% 50%" }}
                            />
                        </div>
                        <div className="slide">
                            <img
                                data-opt-id={2041629506}
                                data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/rt:fill/w:1728/h:1080/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View01_04-WINDOW-2-scaled.jpg"
                                decoding="async"
                                src="https://mlk2eo8xdoqk.i.optimole.com/rt:fill/w:1728/h:1080/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View01_04-WINDOW-2-scaled.jpg"
                                alt=""
                                loading="lazy"
                                className="slide_img u-cover-object"
                                style={{ objectPosition: "53% 61%" }}
                            />
                        </div>
                        <div className="slide">
                            <img
                                data-opt-id={1193098121}
                                data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View02_06-1-scaled.jpg"
                                decoding="async"
                                src="https://mlk2eo8xdoqk.i.optimole.com/rt:fill/w:1728/h:1080/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View02_06-1-scaled.jpg"
                                alt=""
                                loading="lazy"
                                className="slide_img u-cover-object"
                                style={{ objectPosition: "50% 59%" }}
                            />
                        </div>
                        <div className="slide">
                            <img
                                data-opt-id={1739433719}
                                data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View08_160331-6-scaled.jpg"
                                decoding="async"
                                src="https://mlk2eo8xdoqk.i.optimole.com/rt:fill/w:1728/h:1080/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View08_160331-6-scaled.jpg"
                                alt=""
                                loading="lazy"
                                className="slide_img u-cover-object"
                                style={{ objectPosition: "49% 63%" }}
                            />
                        </div>
                        <div className="slide">
                            <img
                                data-opt-id={1505727293}
                                data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View06_160331-3-scaled.jpg"
                                decoding="async"
                                src="https://mlk2eo8xdoqk.i.optimole.com/rt:fill/w:1728/h:1080/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View06_160331-3-scaled.jpg"
                                alt=""
                                loading="lazy"
                                className="slide_img u-cover-object"
                                style={{ objectPosition: "49% 67%" }}
                            />
                        </div>
                        <div className="slide">
                            <img
                                data-opt-id={946469175}
                                data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View05_160401-1-scaled.jpg"
                                decoding="async"
                                src="https://mlk2eo8xdoqk.i.optimole.com/rt:fill/w:1728/h:1080/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View05_160401-1-scaled.jpg"
                                alt=""
                                loading="lazy"
                                className="slide_img u-cover-object"
                                style={{ objectPosition: "50% 61%" }}
                            />
                        </div>
                        <div className="slide">
                            <img
                                data-opt-id={1405570156}
                                data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1942/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/WICKSIDE_VIEW_3_update-2-scaled.jpg"
                                decoding="async"
                                src="https://mlk2eo8xdoqk.i.optimole.com/rt:fill/w:1728/h:1080/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/WICKSIDE_VIEW_3_update-2-scaled.jpg"
                                alt=""
                                loading="lazy"
                                className="slide_img u-cover-object"
                                style={{ objectPosition: "50% 50%" }}
                            />
                        </div>
                        <div className="slide">
                            <img
                                data-opt-id={1780422372}
                                data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View04_03-1-scaled.jpg"
                                decoding="async"
                                src="https://mlk2eo8xdoqk.i.optimole.com/rt:fill/w:1728/h:1080/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View04_03-1-scaled.jpg"
                                alt=""
                                loading="lazy"
                                className="slide_img u-cover-object"
                                style={{ objectPosition: "51% 51%" }}
                            />
                        </div>
                        <div className="divider" />
                    </div>
                </div>


                <nav className="controls" role="navigation" aria-label="Slide controls">
                    <button className="controls_btn -prev u-disable-button" type="button" aria-label="Previous slide">Previous</button>
                    <button className="controls_btn -next u-disable-button" type="button" aria-label="Next slide">Next</button>

                    <div className="controls_arrow lg:flex hidden">
                        <div className="arrow_el" />
                    </div>
                </nav>

                <div className="pagination" role="status" aria-live="polite" aria-label="Slide navigation">
                    <span className="pagination_current">1</span>
                    <span className="pagination_divider">/</span>
                    <span className="pagination_total">{8}</span>
                </div>
            </div>
        </section>
    );
}



// return (
//     <section
//         data-cid="media-swiper"
//         data-js=""
//         data-js-loaded="false"
//         data-js-mounted="false"
//         id="block_dd9aad6785a736025ff91d29a5a37e11"
//         className="block-media-swiper  -offset-block-end-ltr c-media-swiper u-default"
//     >
//         <div
//             className="block_inner"
//             style={{ paddingBlock: "clamp(0.00px, calc(0.00px + 0.00000cqw), 0.00px)" }}
//         >
//             <div className="slides" data-cursor="hidden">
//                 <div className="slides_wrapper">
//                     <div className="slide">
//                         <img

//                             decoding="async"
//                             src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/WICKSIDE_VIEW_8-2-scaled.jpg"
//                             sizes="(max-width: 1000px) 100vw, 1000px"
//                             alt=""
//                             loading="lazy"
//                             className="slide_img u-cover-object"
//                             style={{ objectPosition: "50% 50%" }}
//                         />
//                     </div>
//                     <div className="slide">
//                         <img
//                             data-opt-id={2041629506}
//                             data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View01_04-WINDOW-2-scaled.jpg"
//                             decoding="async"
//                             src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:eco/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View01_04-WINDOW-2-scaled.jpg"
//                             alt=""
//                             loading="lazy"
//                             className="slide_img u-cover-object"
//                             style={{ objectPosition: "53% 61%" }}
//                         />
//                     </div>
//                     <div className="slide">
//                         <img
//                             data-opt-id={1193098121}
//                             data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View02_06-1-scaled.jpg"
//                             decoding="async"
//                             src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:eco/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View02_06-1-scaled.jpg"
//                             alt=""
//                             loading="lazy"
//                             className="slide_img u-cover-object"
//                             style={{ objectPosition: "50% 59%" }}
//                         />
//                     </div>
//                     <div className="slide">
//                         <img
//                             data-opt-id={1739433719}
//                             data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View08_160331-6-scaled.jpg"
//                             decoding="async"
//                             src="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:eco/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View08_160331-6-scaled.jpg"
//                             alt=""
//                             loading="lazy"
//                             className="slide_img u-cover-object"
//                             style={{ objectPosition: "49% 63%" }}
//                         />
//                     </div>
//                     <div className="slide">
//                         <img
//                             data-opt-id={1505727293}
//                             data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View06_160331-3-scaled.jpg"
//                             decoding="async"
//                             src="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:eco/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View06_160331-3-scaled.jpg"
//                             alt=""
//                             loading="lazy"
//                             className="slide_img u-cover-object"
//                             style={{ objectPosition: "49% 67%" }}
//                         />
//                     </div>
//                     <div className="slide">
//                         <img
//                             data-opt-id={946469175}
//                             data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View05_160401-1-scaled.jpg"
//                             decoding="async"
//                             src="https://mlk2eo8xdoqk.i.optimole.com/w:1080/h:1080/q:eco/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/FM_View05_160401-1-scaled.jpg"
//                             alt=""
//                             loading="lazy"
//                             className="slide_img u-cover-object"
//                             style={{ objectPosition: "50% 61%" }}
//                         />
//                     </div>
//                     <div className="slide">
//                         <img
//                             data-opt-id={1405570156}
//                             data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1942/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/WICKSIDE_VIEW_3_update-2-scaled.jpg"
//                             decoding="async"
//                             src="https://mlk2eo8xdoqk.i.optimole.com/w:1942/h:1080/q:eco/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/WICKSIDE_VIEW_3_update-2-scaled.jpg"
//                             alt=""
//                             loading="lazy"
//                             className="slide_img u-cover-object"
//                             style={{ objectPosition: "50% 50%" }}
//                         />
//                     </div>
//                     <div className="slide">
//                         <img
//                             data-opt-id={1780422372}
//                             data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View04_03-1-scaled.jpg"
//                             decoding="async"
//                             src="https://mlk2eo8xdoqk.i.optimole.com/w:1440/h:1080/q:eco/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/18074-BUJ-HackneyWickside_View04_03-1-scaled.jpg"
//                             alt=""
//                             loading="lazy"
//                             className="slide_img u-cover-object"
//                             style={{ objectPosition: "51% 51%" }}
//                         />
//                     </div>
//                     <div className="divider" />
//                 </div>
//             </div>
//             {/* <nav className="controls" role="navigation">
//                 <button
//                     className="controls_btn -prev u-disable-button"
//                     type="button"
//                     aria-label="Previous slide"
//                     data-cursor="hidden"
//                 >
//                     Previous
//                 </button>
//                 <button
//                     className="controls_btn -next u-disable-button"
//                     type="button"
//                     aria-label="Next slide"
//                     data-cursor="hidden"
//                 >
//                     Next
//                 </button>
//                 <div className="controls_arrow lg:flex hidden">
//                     <div className="arrow_el" />
//                 </div>
//             </nav>
//             <div
//                 className="pagination"
//                 role="status"
//                 aria-live="polite"
//                 aria-label="Slide navigation"
//             >
//                 <span className="pagination_current">1</span>
//                 <span className="pagination_divider">/</span>
//                 <span className="pagination_total">8</span>
//             </div> */}
//         </div>
//     </section>

// )
// }

// export default MediaSwiper