import React, { act, useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CardsShuffleOptions {
    animationDuration: number;
    animationEase: string;
    randomPositionRange: number;
    randomRotationRange: number;
    activeRotationRange: number;
    contentOffsetMultiplier: number;
    activeCardScale: number;
    mouseFocusDelay: number;
    desktopBreakpoint: number;
    resizeDebounce: number;
    pagination: {
        duration: number;
        opacity: number;
        xOffset: number;
        easeIn: string;
        easeOut: string;
    };
}

const options: CardsShuffleOptions = {
    animationDuration: 1,
    animationEase: "elastic.out(1, 0.75)",
    randomPositionRange: 10,
    randomRotationRange: 20,
    activeRotationRange: 4,
    contentOffsetMultiplier: 60,
    activeCardScale: 1.1,
    mouseFocusDelay: 100,
    desktopBreakpoint: 1025,
    resizeDebounce: 200,
    pagination: {
        duration: 0.2,
        opacity: 0.7,
        xOffset: 3,
        easeIn: "power2.in",
        easeOut: "power2.out"
    }
};

const CardsShuffle = () => {
    const desktopContainerRef = useRef<HTMLDivElement | null>(null);
    const mobileSwiperRef = useRef<HTMLDivElement | null>(null);

    const swiperInstance = useRef<any>(null);
    const desktopHandlers = useRef<any>(null);
    const resizeTimeout = useRef<any>(null);

    const log = (...args: any[]) => console.log("[CardsShuffle]", ...args);

    const cleanupDesktopEvents = () => {
        const c = desktopContainerRef.current;
        if (!c || !desktopHandlers.current) return;

        c.removeEventListener("mousemove", desktopHandlers.current.mouseMove);
        c.removeEventListener("mouseleave", desktopHandlers.current.mouseLeave);

        const cards: HTMLElement[] = Array.from(c.querySelectorAll(".card"));
        cards.forEach(card => {
            card.removeEventListener("focus", desktopHandlers.current.focus);
            card.removeEventListener("blur", desktopHandlers.current.blur);
            card.removeEventListener("mousedown", desktopHandlers.current.mouseDown);
        });

        desktopHandlers.current = null;
    };

    // const destroySwiper = () => {
    //     if (swiperInstance.current) {
    //         swiperInstance.current.destroy(true, true);
    //         swiperInstance.current = null;
    //     }
    // };

    const activateDesktop = () => {
        // destroySwiper();
        cleanupDesktopEvents();

        const dc = desktopContainerRef.current;
        const cards = dc?.querySelectorAll(".card");
        const cardContent = dc?.querySelectorAll(".card_inner");

        if (!dc || !cards || cards.length === 0) {
            log("Cards not found");
            return;
        }

        if (mobileSwiperRef.current) mobileSwiperRef.current.style.display = "none";
        dc.style.display = "";

        let activeIndex = 0;

        const { randomPositionRange, randomRotationRange } = options;

        cards.forEach(card => {
            gsap.set(card, {
                xPercent: (Math.random() - 0.5) * randomPositionRange,
                yPercent: (Math.random() - 0.5) * randomPositionRange,
                rotation: (Math.random() - 0.5) * randomRotationRange
            });
        });

        const activateCard = (index: number) => {

            cards.forEach((c, i) => {
                // if (!inner) return;
                const o = c.querySelector(".card_inner");
                o && ((o as HTMLElement).style.pointerEvents = i === index ? "auto" : "none"),

                    (c as HTMLElement).style.zIndex = i === index ? "10" : "";
            });

            gsap.to(cards[index], {
                xPercent: 0,
                yPercent: 0,
                rotation:
                    Math.random() * options.activeRotationRange -
                    options.activeRotationRange / 2,
                scale: options.activeCardScale,
                duration: options.animationDuration,
                ease: options.animationEase
            })
            cardContent?.forEach((c, i) => {
                gsap.to(c, {
                    xPercent: i !== index ? options.contentOffsetMultiplier / (i - index) : 0,
                    duration: options.animationDuration,
                    ease: options.animationEase
                });
            })
            // gsap.to(c, {
            //     xPercent: i === index ? 0 : (Math.random() - 0.5) * randomPositionRange,
            //     yPercent: i === index ? 0 : (Math.random() - 0.5) * randomPositionRange,
            //     rotation:
            //         i === index
            //             ? Math.random() * options.activeRotationRange -
            //             options.activeRotationRange / 2
            //             : (Math.random() - 0.5) * randomRotationRange,
            //     scale: i === index ? options.activeCardScale : 1,
            //     duration: options.animationDuration,
            //     ease: options.animationEase
            // });



        };

        const resetCards = () => {
            gsap.to(cardContent || [], {
                xPercent: 0,
                duration: options.animationDuration,
                ease: options.animationEase
            });
            cards.forEach((s) => {
                if (s) {
                    const n = s.querySelector(".card_inner") as HTMLElement;
                    n && (n.style.pointerEvents = ""),
                        (s as HTMLElement).style.zIndex = ""
                    s.classList.remove("is-active")
                }
            }
            ),
                cards[activeIndex - 1] && gsap.to(cards[activeIndex - 1], {
                    xPercent: (Math.random() - .5) * options.randomPositionRange,
                    yPercent: (Math.random() - .5) * options.randomPositionRange,
                    rotation: (Math.random() - .5) * options.randomRotationRange,
                    scale: 1,
                    duration: options.animationDuration,
                    ease: options.animationEase
                })

            activeIndex = 0;
        };

        const mouseMoveHandler = (e: MouseEvent) => {
            const rect = dc.getBoundingClientRect();
            const x = e.clientX - rect.left;
            let selected = 0;

            cards.forEach((card, index) => {
                const r = card.getBoundingClientRect();
                const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
                if (inside) selected = index + 1;
            });
            if (selected !== activeIndex) {
                cards[activeIndex - 1] && gsap.to(cards[activeIndex - 1], {
                    xPercent: (Math.random() - .5) * options.randomPositionRange,
                    yPercent: (Math.random() - .5) * options.randomPositionRange,
                    rotation: (Math.random() - .5) * options.randomRotationRange,
                    scale: 1,
                    duration: options.animationDuration,
                    ease: options.animationEase
                })
            }
            if (selected && selected !== activeIndex) {
                activeIndex = selected;
                activateCard(activeIndex - 1);
            }
        };

        const mouseLeaveHandler = () => resetCards();

        desktopHandlers.current = {
            mouseMove: mouseMoveHandler,
            mouseLeave: mouseLeaveHandler,
        };

        dc.addEventListener("mousemove", mouseMoveHandler);
        dc.addEventListener("mouseleave", mouseLeaveHandler);
    };

    const activateMobile = async () => {
        cleanupDesktopEvents();
        // destroySwiper();

        const mobile = mobileSwiperRef.current;
        const desktop = desktopContainerRef.current;
        if (!mobile) return;

        desktop!.style.display = "none";
        mobile.style.display = "";

        // const [{ default: Swiper, EffectCards, A11y }] = await Promise.all([
        //     import("swiper"),
        //     import("swiper/modules"),
        // ]);

        // swiperInstance.current = new Swiper(mobile, {
        //     modules: [EffectCards, A11y],
        //     effect: "cards",
        //     grabCursor: true,
        //     watchSlidesProgress: true,
        //     on: {
        //         slideChange() {
        //             const el = mobile.querySelector(".pagination_current");
        //             if (!el) return;
        //             el.textContent = String(this.realIndex + 1);
        //         }
        //     }
        // });
    };

    const evaluateMode = () => {
        const isMobile = window.innerWidth < options.desktopBreakpoint;
        isMobile ? activateMobile() : activateDesktop();
    };

    useEffect(() => {
        evaluateMode();
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimeout.current);
            resizeTimeout.current = setTimeout(evaluateMode, options.resizeDebounce);
        });

        return () => {
            cleanupDesktopEvents();
            // destroySwiper();
        };
    }, []);
    return (
        <section data-cid="cards-shuffle" data-js data-js-loaded="false" data-js-mounted="false" id="block_5c9315d0fb8c868caa6174555ee11aba" className="block-cards-shuffle  -offset-block-start-rtl c-cards-shuffle u-default">
            <div className="block_inner u-container u-container--pad inview-trigger" style={{ "paddingTop": "clamp(70.00px, calc(59.50px + 2.50000cqw), 100.00px)", "paddingBottom": "clamp(50.00px, calc(32.50px + 4.16667cqw), 100.00px)" } as React.CSSProperties}>
                <hgroup className="hgroup inview-trigger">
                    <h6 className="hgroup_heading inview-element u-wysiwyg-text--1">A gateway to anywhere
                    </h6>
                    <div className="hgroup_text inview-element u-wysiwyg-text--1 u-wysiwyg-lists--1">
                        <p>Travel Times From Wickside</p>
                    </div>
                </hgroup>
                <div ref={desktopContainerRef} className="cards-shuffle-desktop-container">
                    <div className="card" style={{ "--card-color": "#ffa5c1", "--card-line-color": "#380921" } as React.CSSProperties} tab-index="0" role="complementary" aria-label="Foot information">
                        <div className="card_inner">
                            <figure className="media">
                                <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/foot.svg" decoding="async" src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/foot.svg" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": "0.5", "--focal-point-top": "0.5" } as React.CSSProperties} />
                            </figure>
                            <div className="content">
                                <div className="content_title">
                                    By <strong>Foot</strong>
                                </div>
                                <div className="content_list">
                                    <div className="list_item">
                                        <span className="item_name item_col">Hackney W. Station</span>
                                        <span className="item_value item_col">2 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Victoria park</span>
                                        <span className="item_value item_col">7 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Westfield</span>
                                        <span className="item_value item_col">20 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Stratford TFL</span>
                                        <span className="item_value item_col">22 mins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card -reverse-travel-time-color" style={{ "--card-color": "#ff6606", "--card-line-color": "#380921" } as React.CSSProperties} tab-index="0" role="complementary" aria-label="Bike information">
                        <div className="card_inner">
                            <figure className="media">
                                <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/bike.svg" decoding="async" src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/bike.svg" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                            </figure>
                            <div className="content">
                                <div className="content_title">
                                    By <strong>Bike</strong>
                                </div>
                                <div className="content_list">
                                    <div className="list_item">
                                        <span className="item_name item_col">Broadway market</span>
                                        <span className="item_value item_col">8 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Shoreditch/City</span>
                                        <span className="item_value item_col">20 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Canary Wharf</span>
                                        <span className="item_value item_col">20 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Soho/Westend</span>
                                        <span className="item_value item_col">30 mins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ "--card-color": "#60f63d", "--card-line-color": "#003019" } as React.CSSProperties} tab-index="0" role="complementary" aria-label="Car information">
                        <div className="card_inner">
                            <figure className="media">
                                <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/car.svg" decoding="async" src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/car.svg" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                            </figure>
                            <div className="content">
                                <div className="content_title">
                                    By <strong>Car</strong>
                                </div>
                                <div className="content_list">
                                    <div className="list_item">
                                        <span className="item_name item_col">City Airport</span>
                                        <span className="item_value item_col">20 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Blackwall tunnel</span>
                                        <span className="item_value item_col">20 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">M25 North</span>
                                        <span className="item_value item_col">30 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Oxford Circus</span>
                                        <span className="item_value item_col">30 mins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ "--card-color": "#7ce0f6", "--card-line-color": "#10162d" } as React.CSSProperties} tab-index="0" role="complementary" aria-label="Bus information">
                        <div className="card_inner">
                            <figure className="media">
                                <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/bus.svg" decoding="async" src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/bus.svg" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                            </figure>
                            <div className="content">
                                <div className="content_title">
                                    By <strong>Bus</strong>
                                </div>
                                <div className="content_list">
                                    <div className="list_item">
                                        <span className="item_name item_col">Shoreditch</span>
                                        <span className="item_value item_col">20 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Euston</span>
                                        <span className="item_value item_col">40 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">London Bridge</span>
                                        <span className="item_value item_col">40 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Marble Arch</span>
                                        <span className="item_value item_col">40 mins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card -reverse-travel-time-color" style={{ "--card-color": "#9786fa", "--card-line-color": "#10162d" } as React.CSSProperties} tab-index="0" role="complementary" aria-label="Train information">
                        <div className="card_inner">
                            <figure className="media">
                                <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/train.svg" decoding="async" src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/train.svg" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                            </figure>
                            <div className="content">
                                <div className="content_title">
                                    By <strong>Train</strong>
                                </div>
                                <div className="content_list">
                                    <div className="list_item">
                                        <span className="item_name item_col">City Airport</span>
                                        <span className="item_value item_col">25 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Liverpool St./City</span>
                                        <span className="item_value item_col">25 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Soho</span>
                                        <span className="item_value item_col">10 mins</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Victoria Station</span>
                                        <span className="item_value item_col">30 mins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card -reverse-travel-time-color" style={{ "--card-color": "#a09a8d", "--card-line-color": "#000000" } as React.CSSProperties} tab-index="0" role="complementary" aria-label="Plane information">
                        <div className="card_inner">
                            <figure className="media">
                                <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/plane.svg" decoding="async" src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/plane.svg" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                            </figure>
                            <div className="content">
                                <div className="content_title">
                                    By <strong>Plane</strong>
                                </div>
                                <div className="content_list">
                                    <div className="list_item">
                                        <span className="item_name item_col">Heathrow</span>
                                        <span className="item_value item_col">1 hr</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Gatwick</span>
                                        <span className="item_value item_col">1.5 hrs</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">Stansted</span>
                                        <span className="item_value item_col">1.5 hrs</span>
                                    </div>
                                    <div className="list_item">
                                        <span className="item_name item_col">New York</span>
                                        <span className="item_value item_col">8.5 hrs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div ref={mobileSwiperRef} className="cards-shuffle-mobile-swiper swiper" data-cursor data-cursor-text="DRAG">
                    <div className="swiper-wrapper">
                        <div className="card swiper-slide" style={{ "--card-color": "#ffa5c1", "--card-line-color": "#380921" } as React.CSSProperties}>
                            <div className="card_inner">
                                <figure className="media">
                                    <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/foot.svg" decoding="async" src="data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20100%%20100%%22%20width%3D%22100%%22%20height%3D%22100%%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%%22%20height%3D%22100%%22%20fill%3D%22transparent%22%2F%3E%3C%2Fsvg%3E" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="content">
                                    <div className="content_title">
                                        By <strong>Foot</strong>
                                    </div>
                                    <div className="content_list">
                                        <div className="list_item">
                                            <span className="item_name item_col">Hackney W. Station</span>
                                            <span className="item_value item_col">2 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Victoria park</span>
                                            <span className="item_value item_col">7 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Westfield</span>
                                            <span className="item_value item_col">20 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Stratford TFL</span>
                                            <span className="item_value item_col">22 mins</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card -reverse-travel-time-color swiper-slide" style={{ "--card-color": "#ff6606", "--card-line-color": "#380921" } as React.CSSProperties}>
                            <div className="card_inner">
                                <figure className="media">
                                    <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/bike.svg" decoding="async" src="data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20100%%20100%%22%20width%3D%22100%%22%20height%3D%22100%%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%%22%20height%3D%22100%%22%20fill%3D%22transparent%22%2F%3E%3C%2Fsvg%3E" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="content">
                                    <div className="content_title">
                                        By <strong>Bike</strong>
                                    </div>
                                    <div className="content_list">
                                        <div className="list_item">
                                            <span className="item_name item_col">Broadway market</span>
                                            <span className="item_value item_col">8 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Shoreditch/City</span>
                                            <span className="item_value item_col">20 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Canary Wharf</span>
                                            <span className="item_value item_col">20 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Soho/Westend</span>
                                            <span className="item_value item_col">30 mins</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card swiper-slide" style={{ "--card-color": "#60f63d", "--card-line-color": "#003019" } as React.CSSProperties}>
                            <div className="card_inner">
                                <figure className="media">
                                    <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/car.svg" decoding="async" src="data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20100%%20100%%22%20width%3D%22100%%22%20height%3D%22100%%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%%22%20height%3D%22100%%22%20fill%3D%22transparent%22%2F%3E%3C%2Fsvg%3E" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="content">
                                    <div className="content_title">
                                        By <strong>Car</strong>
                                    </div>
                                    <div className="content_list">
                                        <div className="list_item">
                                            <span className="item_name item_col">City Airport</span>
                                            <span className="item_value item_col">20 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Blackwall tunnel</span>
                                            <span className="item_value item_col">20 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">M25 North</span>
                                            <span className="item_value item_col">30 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Oxford Circus</span>
                                            <span className="item_value item_col">30 mins</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card swiper-slide" style={{ "--card-color": "#7ce0f6", "--card-line-color": "#10162d" } as React.CSSProperties}>
                            <div className="card_inner">
                                <figure className="media">
                                    <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/bus.svg" decoding="async" src="data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20100%%20100%%22%20width%3D%22100%%22%20height%3D%22100%%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%%22%20height%3D%22100%%22%20fill%3D%22transparent%22%2F%3E%3C%2Fsvg%3E" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="content">
                                    <div className="content_title">
                                        By <strong>Bus</strong>
                                    </div>
                                    <div className="content_list">
                                        <div className="list_item">
                                            <span className="item_name item_col">Shoreditch</span>
                                            <span className="item_value item_col">20 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Euston</span>
                                            <span className="item_value item_col">40 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">London Bridge</span>
                                            <span className="item_value item_col">40 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Marble Arch</span>
                                            <span className="item_value item_col">40 mins</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card -reverse-travel-time-color swiper-slide" style={{ "--card-color": "#9786fa", "--card-line-color": "#10162d" } as React.CSSProperties}>
                            <div className="card_inner">
                                <figure className="media">
                                    <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/train.svg" decoding="async" src="data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20100%%20100%%22%20width%3D%22100%%22%20height%3D%22100%%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%%22%20height%3D%22100%%22%20fill%3D%22transparent%22%2F%3E%3C%2Fsvg%3E" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="content">
                                    <div className="content_title">
                                        By <strong>Train</strong>
                                    </div>
                                    <div className="content_list">
                                        <div className="list_item">
                                            <span className="item_name item_col">City Airport</span>
                                            <span className="item_value item_col">25 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Liverpool St./City</span>
                                            <span className="item_value item_col">25 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Soho</span>
                                            <span className="item_value item_col">10 mins</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Victoria Station</span>
                                            <span className="item_value item_col">30 mins</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card -reverse-travel-time-color swiper-slide" style={{ "--card-color": "#a09a8d", "--card-line-color": "#000000" } as React.CSSProperties}>
                            <div className="card_inner">
                                <figure className="media">
                                    <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:auto/h:auto/q:mauto/f:best/ig:avif/https://wicksidelife.com/wp-content/uploads/2025/07/plane.svg" decoding="async" src="data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20100%%20100%%22%20width%3D%22100%%22%20height%3D%22100%%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%%22%20height%3D%22100%%22%20fill%3D%22transparent%22%2F%3E%3C%2Fsvg%3E" className="optimole-lazy-only  media_img u-cover-object img-crop focal-point-image" alt="" style={{ "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="content">
                                    <div className="content_title">
                                        By <strong>Plane</strong>
                                    </div>
                                    <div className="content_list">
                                        <div className="list_item">
                                            <span className="item_name item_col">Heathrow</span>
                                            <span className="item_value item_col">1 hr</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Gatwick</span>
                                            <span className="item_value item_col">1.5 hrs</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">Stansted</span>
                                            <span className="item_value item_col">1.5 hrs</span>
                                        </div>
                                        <div className="list_item">
                                            <span className="item_name item_col">New York</span>
                                            <span className="item_value item_col">8.5 hrs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pagination" role="status" aria-live="polite" aria-label="Slide navigation">
                        <span className="pagination_current">1</span>
                        <span className="pagination_divider">/</span>
                        <span className="pagination_total">6</span>
                    </div>
                </div>
            </div>
            <div className="block_offset"></div>
        </section>
    )
}

export default CardsShuffle