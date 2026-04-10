import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ComingEarlymarq = ({ text, rotate }: { text: string, rotate: boolean }) => {
    const marqueeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = marqueeRef.current;
        if (!root) return;

        const marquees = root.querySelectorAll<HTMLElement>(
            "[data-marquee-scroll-direction-target]"
        );

        const options = {
            speedMultipliers: [
                { max: 479, value: 0.25 },
                { max: 991, value: 0.5 },
                { max: Infinity, value: 1 },
            ],
            defaultSpeed: 1,
            defaultDirection: "left",
            defaultDuplicate: 0,
            defaultScrollSpeed: 0,
            animationEase: "linear",
            initialProgress: 0.5,
            scrollTriggerScrub: 0,
        };

        const getSpeedMultiplier = () => {
            const width = window.innerWidth;
            return options.speedMultipliers.find((o) => width <= o.max)?.value ?? 1;
        };

        marquees.forEach((marquee) => {
            const collection = marquee.querySelector<HTMLElement>(
                "[data-marquee-collection-target]"
            );
            const scrollTarget = marquee.querySelector<HTMLElement>(
                "[data-marquee-scroll-target]"
            );
            if (!collection || !scrollTarget) return;

            const {
                marqueeSpeed,
                marqueeDirection,
                marqueeDuplicate,
                marqueeScrollSpeed,
            } = marquee.dataset;

            const speed = parseFloat(marqueeSpeed || "") || options.defaultSpeed;
            const direction = marqueeDirection === "right" ? 1 : -1;
            const duplicate = parseInt(marqueeDuplicate || "0", 10);
            const scrollSpeed =
                parseFloat(marqueeScrollSpeed || "") || options.defaultScrollSpeed;
            const multiplier = getSpeedMultiplier();
            const duration = speed * (collection.offsetWidth / window.innerWidth) * multiplier;

            // scroll target styling
            scrollTarget.style.marginLeft = `${scrollSpeed * -1}%`;
            scrollTarget.style.width = `${scrollSpeed * 2 + 100}%`;

            // duplicate
            if (duplicate > 0) {
                const frag = document.createDocumentFragment();
                for (let i = 0; i < duplicate; i++) {
                    frag.appendChild(collection.cloneNode(true));
                }
                scrollTarget.appendChild(frag);
            }

            const allCollections = marquee.querySelectorAll<HTMLElement>(
                "[data-marquee-collection-target]"
            );

            // GSAP infinite horizontal scroll
            const tl = gsap
                .to(allCollections, {
                    xPercent: -100,
                    repeat: -1,
                    duration,
                    ease: options.animationEase,
                })
                .totalProgress(options.initialProgress);

            gsap.set(allCollections, {
                xPercent: direction === 1 ? 100 : -100,
            });

            tl.timeScale(direction);
            tl.play();

            // ScrollTrigger inversion
            ScrollTrigger.create({
                trigger: marquee,
                start: "top bottom",
                end: "bottom top",
                onUpdate: (self) => {
                    const isDesktop = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
                    const scrollingDown = self.direction === 1;
                    const invertDirection = scrollingDown ? -direction : direction;
                    if (isDesktop) {
                        tl.timeScale(invertDirection);
                        marquee.setAttribute(
                            "data-marquee-status",
                            scrollingDown ? "normal" : "inverted"
                        );
                    } else {
                        tl.timeScale(direction);
                        marquee.setAttribute("data-marquee-status", "normal");
                    }
                },
            });

            // Optional scroll-triggered movement
            if (window.matchMedia("(pointer: fine) and (hover: hover)").matches) {
                const scrubbingTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: marquee,
                        start: "0% 100%",
                        end: "100% 0%",
                        scrub: options.scrollTriggerScrub,
                    },
                });
                const startX = direction === -1 ? scrollSpeed : -scrollSpeed;
                scrubbingTl.fromTo(
                    scrollTarget,
                    { x: `${startX}vw` },
                    { x: `${-startX}vw`, ease: "none" }
                );
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach((st) => st.kill());
            gsap.globalTimeline.clear();
        };
    }, []);
    return (
        <section
            style={{
                paddingTop: "clamp(11.00px, calc(11.00px + 0.00000cqw), 11.00px)",
                paddingBottom: "clamp(8.00px, calc(8.00px + 0.00000cqw), 8.00px)",
            }}

            className="block-marquee-text c-marquee-text u-default bg-transparent z-2 py-0 relative h-auto w-full"
        >
            <div
                ref={marqueeRef}
                className={`marquee ${rotate && "lg:rotate-(--rotation-desktop) rotate-(--rotate-mobile)"} lg:transform-[translate(-5vw)] transform-[translate(-5vw)] flex perspective-distant pointer-events-none relative   w-[110vw] h-auto z-1`}
                style={{
                    "--rotation-mobile": "2.8deg",
                    "--rotation-desktop": "0.6deg",
                } as React.CSSProperties}
            >
                {/* Moving marquee text (left) */}
                <div
                    className="marquee_active marquee_face "
                    data-marquee-duplicate="2"
                    data-marquee-scroll-direction-target
                    data-marquee-direction="left"
                    data-marquee-status="normal"
                    data-marquee-speed="15"
                    data-marquee-scroll-speed="10"
                >
                    <div data-marquee-scroll-target className="marquee_scroll">
                        <div data-marquee-collection-target className="marquee_collection">
                            <div className="marquee_item">
                                <p
                                    className="item_text"
                                    style={{
                                        fontSize:
                                            "clamp(48.00px, calc(48.00px + (100.00 - 48.00) * ((var(--cw) - 420.00px) / (1620.00 - 420.00))), 100.00px)",
                                        lineHeight: "1em",
                                    }}
                                >
                                    {text}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Static marquee text (right) */}
                <div
                    className="marquee_static marquee_face"
                    data-marquee-duplicate="2"
                    data-marquee-scroll-direction-target
                    data-marquee-direction="right"
                    data-marquee-status="normal"
                    data-marquee-speed="15"
                    data-marquee-scroll-speed="10"
                >
                    <div data-marquee-scroll-target className="marquee_scroll">
                        <div data-marquee-collection-target className="marquee_collection">
                            <div className="marquee_item">
                                <p
                                    className="item_text"
                                    style={{
                                        fontSize:
                                            "clamp(48.00px, calc(48.00px + (100.00 - 48.00) * ((var(--cw) - 420.00px) / (1620.00 - 420.00))), 100.00px)",
                                        lineHeight: "1em",
                                    }}
                                >
                                    {text}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="block_offset"></div>
        </section>

    )
}

export default ComingEarlymarq