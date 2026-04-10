"use client";
import Image from 'next/image'

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";


gsap.registerPlugin(ScrollTrigger);

interface CardsMarqueeProps {
    speed?: number;
    duplicate?: number;
}


const CardsMarq: React.FC<CardsMarqueeProps> = ({
    speed = 8,
    duplicate = 2,
}) => {
    const marqueeRef = useRef<HTMLDivElement | null>(null);
    const collectionRef = useRef<HTMLDivElement | null>(null);
    const animationRef = useRef<gsap.core.Tween | null>(null);

    useEffect(() => {
        const s = marqueeRef.current;
        const l = collectionRef.current;

        if (!s || !l) return;

        const scrollTarget = s; // your root acts like scroll target
        const M = l.offsetWidth;
        const v = window.innerWidth;

        // Mobile scale factor like original (.25 <479, .5 <991, else 1)
        const q =
            v < 479 ? 0.25 : v < 991 ? 0.5 : 1;

        const duration = speed * (M / v) * q;

        // Duplicate cards
        if (duplicate > 0) {
            const frag = document.createDocumentFragment();
            for (let i = 0; i < duplicate; i++) {
                frag.appendChild(l.cloneNode(true));
            }
            scrollTarget.appendChild(frag);
        }

        const items = s.querySelectorAll("[data-marquee-collection-target]");

        animationRef.current = gsap.to(items, {
            xPercent: -100,
            repeat: -1,
            duration: duration * 2,
            ease: "linear",
        }).totalProgress(0.5);

        gsap.set(items, { xPercent: -100 });
        animationRef.current.timeScale(-1); // move left
        animationRef.current.play();

        s.setAttribute("data-marquee-status", "normal");

        let lastTime = 0;

        ScrollTrigger.observe({
            target: scrollTarget,
            type: "pointer,touch",
            onPress: () => {
                s.classList.add("is-dragging");
                lastTime = Date.now();
            },
            onDrag: (observer: Observer) => {
                const e = observer.deltaX;
                const now = Date.now();
                const dt = now - lastTime;
                lastTime = now;

                const progress = animationRef.current!.progress() - e * 0.0015;
                gsap.to(animationRef.current!, {
                    progress,
                    ease: "power3.out",
                    duration: 0.2,
                    overwrite: "auto",
                });

                animationRef.current!.timeScale(e > 0 ? -1 : 1);
            },
            onRelease: () => {
                s.classList.remove("is-dragging");
            },
            lockAxis: true,
        } as any);


        return () => {
            animationRef.current?.kill();
            ScrollTrigger.getAll().forEach((st) => st.kill());
        };
    }, [speed, duplicate]);
    return (
        <section

            data-cid="cards-marquee" data-js data-js-loaded="false" data-js-mounted="false" id="block_aac78bfa0c85991a5af4c8820ffb0b48" className="block-cards-marquee   c-cards-marquee u-default" style={{ "--block-color-heading": "#380921", "--block-color-text": "#ffa5c1" } as React.CSSProperties}>
            <div className="block_inner block_main">
                <hgroup className="hgroup u-container u-container--pad inview-trigger">
                    <div className="hgroup_heading inview-element u-wysiwyg-text--1">BE INSPIRED
                    </div>
                    <div className="hgroup_text inview-element u-wysiwyg-text--1 u-wysiwyg-lists--1">
                        <p>
                            <a href="https://www.instagram.com/wicksidelife/" target="_blank" rel="noopener" data-cursor-text="FOLLOW">
                                <span style={{ "fontFamily": "var(--family--1)" } as React.CSSProperties}>@WICKSIDELIFE</span>
                            </a>
                        </p>
                    </div>
                </hgroup>
                <div className="marquee" data-marquee-scroll-direction-target data-marquee-status="normal">
                    <div ref={marqueeRef} data-marquee-scroll-target className="marquee_scroll">
                        <div ref={collectionRef} data-marquee-collection-target className="cards">
                            <figure className="card" data-index="1">
                                <figure className="card_image">
                                    <Image data-opt-id='1888919198' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317773.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317773.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Discover The<br />Art Of Living

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="2">
                                <figure className="card_image">
                                    <Image data-opt-id='1012613735' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317774.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317774.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Shared<br />Moments Await

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="3">
                                <figure className="card_image">
                                    <Image data-opt-id='2059772389' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:741/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317775.jpg" decoding="async" width="741" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317775.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Not Afraid<br />To Be Bold

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="4">
                                <figure className="card_image">
                                    <Image data-opt-id='793622567' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317776.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317776.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        City Moves,<br />Hackney Mood

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="5">
                                <figure className="card_image">
                                    <Image data-opt-id='30603877' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317777.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317777.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Miles, Murals,<br />Morning Light

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="6">
                                <figure className="card_image">
                                    <Image data-opt-id='232772144' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:741/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317778.jpg" decoding="async" width="741" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317778.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Your New<br />Favourite Spot

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="7">
                                <figure className="card_image">
                                    <Image data-opt-id='353863090' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317779.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317779.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Float Your<br />Own Way

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="8">
                                <figure className="card_image">
                                    <Image data-opt-id='1775466921' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317780.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317780.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Raw. Real.<br />Unfiltered.

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="9">
                                <figure className="card_image">
                                    <Image data-opt-id='2017238389' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317811.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317811.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        City Pace,<br />Nature’s Place

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="10">
                                <figure className="card_image">
                                    <Image data-opt-id='1193600968' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317812.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317812.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Street Art<br />With Deep Soul

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="11">
                                <figure className="card_image">
                                    <Image data-opt-id='1027189992' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:741/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317813.jpg" decoding="async" width="741" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317813.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Padel On Court.<br />Paddle Canal Side.

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="12">
                                <figure className="card_image">
                                    <Image data-opt-id='1433060380' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317814.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317814.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Spritz With A<br />Side Of Green

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="13">
                                <figure className="card_image">
                                    <Image data-opt-id='1202797689' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317815.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317815.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Life Happens<br />By The Water

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="14">
                                <figure className="card_image">
                                    <Image data-opt-id='1998383683' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:741/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317816.jpg" decoding="async" width="741" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317816.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Your Route To<br />Real London

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="15">
                                <figure className="card_image">
                                    <Image data-opt-id='1195026635' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317817.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317817.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Local Flavour.<br />Daily Ritual.

                                    </div>
                                </div>
                            </figure>
                            <figure className="card" data-index="16">
                                <figure className="card_image">
                                    <Image data-opt-id='1484229925' data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317818.jpg" decoding="async" width="740" height="984" src="https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317818.jpg" className="image_src focal-point-image" alt="" style={{ "objectPosition": "center", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                </figure>
                                <div className="card_content">
                                    <div className="card_upper">@wicksidelife</div>
                                    <div className="card_heading">
                                        Tags And<br />Tails

                                    </div>
                                </div>
                            </figure>
                        </div>
                    </div>
                </div>
                <figure className="pattern"></figure>
            </div>
        </section>
    )
}

export default CardsMarq