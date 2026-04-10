import React, { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface MarqueeTextProps {
    speed?: number;
    direction?: "left" | "right";
    duplicate?: number;
    scrollSpeed?: number;
    animationEase?: string;
    scrollTriggerScrub?: number;
}

const MarqueeText: React.FC<MarqueeTextProps> = ({
    speed = 1,
    direction = "left",
    duplicate = 0,
    scrollSpeed = 0,
    animationEase = "linear",
    scrollTriggerScrub = 0,
}) => {
    const marqueeRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const marqueeEl = marqueeRef.current;
        if (!marqueeEl) return;

        const getSpeedMultiplier = (): number => {
            const width = window.innerWidth;
            if (width <= 479) return 0.25;
            if (width <= 991) return 0.5;
            return 1;
        };

        const directionSign = direction === "right" ? 1 : -1;
        const collection = marqueeEl.querySelector<HTMLElement>(
            "[data-marquee-collection-target]"
        );
        const scrollTrack = marqueeEl.querySelector<HTMLElement>(
            "[data-marquee-scroll-target]"
        );
        if (!collection || !scrollTrack) return;

        // Duplicate elements if needed
        const duplicateCount = Number(duplicate) || 0;
        if (duplicateCount > 0) {
            const frag = document.createDocumentFragment();
            for (let i = 0; i < duplicateCount; i++) {
                frag.appendChild(collection.cloneNode(true));
            }
            scrollTrack.appendChild(frag);
        }

        // Adjust scroll track styling
        scrollTrack.style.marginLeft = `${scrollSpeed * -1}%`;
        scrollTrack.style.width = `${scrollSpeed * 2 + 100}%`;

        const allCollections = marqueeEl.querySelectorAll<HTMLElement>(
            "[data-marquee-collection-target]"
        );
        const duration =
            speed * (collection.offsetWidth / window.innerWidth) * getSpeedMultiplier();

        // Base GSAP tween for marquee
        const tween = gsap
            .to(allCollections, {
                xPercent: -100,
                repeat: -1,
                duration,
                ease: animationEase,
            })
            .totalProgress(0.5);

        gsap.set(allCollections, { xPercent: directionSign === 1 ? 100 : -100 });
        tween.timeScale(directionSign);
        tween.play();

        marqueeEl.setAttribute("data-marquee-status", "normal");

        // ScrollTrigger for reversing on scroll direction
        ScrollTrigger.create({
            trigger: marqueeEl,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
                const hasHover = window.matchMedia(
                    "(pointer: fine) and (hover: hover)"
                ).matches;
                const scrollingDown = self.direction === 1;

                if (hasHover) {
                    const reverse = scrollingDown ? -directionSign : directionSign;
                    tween.timeScale(reverse);
                    marqueeEl.setAttribute(
                        "data-marquee-status",
                        scrollingDown ? "normal" : "inverted"
                    );
                } else {
                    tween.timeScale(directionSign);
                    marqueeEl.setAttribute("data-marquee-status", "normal");
                }
            },
        });

        // Parallax effect using ScrollTrigger scrub
        if (window.matchMedia("(pointer: fine) and (hover: hover)").matches) {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: marqueeEl,
                    start: "0% 100%",
                    end: "100% 0%",
                    scrub: scrollTriggerScrub,
                },
            });

            const fromX = directionSign === -1 ? scrollSpeed : -scrollSpeed;
            const toX = -fromX;
            tl.fromTo(
                scrollTrack,
                { x: `${fromX}vw` },
                { x: `${toX}vw`, ease: "none" }
            );
        }

        return () => {
            ScrollTrigger.getAll().forEach((st) => st.kill());
            tween.kill();
        };
    }, [speed, direction, duplicate, scrollSpeed, animationEase, scrollTriggerScrub]);

    return (
        <div
            ref={marqueeRef}
            className="relative overflow-hidden"
            data-marquee-scroll-direction-target
            data-marquee-scroll-speed={scrollSpeed}
        >
            <div data-marquee-scroll-target className="flex">
                <div
                    data-marquee-collection-target
                    className="flex items-center whitespace-nowrap"
                >
                </div>
            </div>
        </div>
    );
};

export default MarqueeText;
