import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import Draggable from "gsap/Draggable";

gsap.registerPlugin(Draggable);

type Maybe<T> = T | null | undefined;
type DraggableInstance = any; // gsap Draggable instance (typing is broad since Draggable typings vary)

const CarsSwiper = () => {

    const containerRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const paginationCurrentRef = useRef<HTMLSpanElement | null>(null);
    const paginationTotalRef = useRef<HTMLSpanElement | null>(null);
    const prevBtnRef = useRef<HTMLButtonElement | null>(null);
    const nextBtnRef = useRef<HTMLButtonElement | null>(null);

    // internal refs
    const currentIndex = useRef<number>(0);
    const totalItems = useRef<number>(0);
    const _handleKeydown = useRef<((e: KeyboardEvent) => void) | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        const list = listRef.current;
        const paginationCurrent = paginationCurrentRef.current;
        const paginationTotal = paginationTotalRef.current;
        const prevBtn = prevBtnRef.current;
        const nextBtn = nextBtnRef.current;

        if (!container || !list) return;

        const items = Array.from(list.querySelectorAll<HTMLDivElement>(".list_item"));
        if (items.length < 2) return;

        totalItems.current = items.length;

        if (paginationCurrent) paginationCurrent.textContent = String(currentIndex.current + 1);
        if (paginationTotal) paginationTotal.textContent = String(totalItems.current);


        const options = {
            activeRotation: 4,
            inactiveRotation: -4,
            fullThreshold: 1.15,
            threshold: 0.1,
            overDragMultiplier: 0.1,
            secondCardOverDragMultiplier: 0.2,
            enableMagnet: true,
            magneticStrength: 0.3,
            magneticStrengthInner: 25,
            magneticEase: "elastic.out(1, 0.3)",
            magneticDuration: 1.6,
            magneticPowerEase: "power4.out",
            enableKeyboard: true,
            keyboardDebounce: 250,
            animation: {
                beforeRelease: { duration: 0.2, ease: "power2.out" },
                afterRelease: { duration: 1, ease: "elastic.out(1,0.75)" },
                pagination: { duration: 0.2, ease: "power2.in" },
                paginationIn: { duration: 0.2, ease: "power2.out" }
            }
        };

        let activeRotation = options.activeRotation;
        let inactiveRotation = options.inactiveRotation;

        let mainDrag: DraggableInstance | undefined;
        let secondDrag: DraggableInstance | undefined;

        let l_fullThreshold = 0; // full threshold px
        let T_threshold = 0; // threshold px
        let cardWidth = 0;

        const animationBeforeRelease = options.animation.beforeRelease;
        const animationAfterRelease = options.animation.afterRelease;

        const setupStack = () => {
            const t = Array.from(list.querySelectorAll<HTMLDivElement>(".list_item"));
            t.forEach((s) => {
                s.classList.remove("is--active", "is--second");
            });

            if (t[0]) {
                t[0].style.zIndex = "3";
                t[0].style.transform = `rotate(${activeRotation}deg)`;
                t[0].style.pointerEvents = "auto";
                t[0].classList.add("is--active");
            }
            if (t[1]) {
                t[1].style.zIndex = "2";
                t[1].style.transform = `rotate(${inactiveRotation}deg)`;
                t[1].style.pointerEvents = "none";
                t[1].classList.add("is--second");
            }
            if (t[2]) {
                t[2].style.zIndex = "1";
                t[2].style.transform = `rotate(${activeRotation}deg)`;
            }
            t.slice(3).forEach((s) => {
                s.style.zIndex = "0";
                s.style.transform = `rotate(${inactiveRotation}deg)`;
            });
        };


        const animatePaginationTo = (index: number) => {
            const n = paginationCurrent;
            if (!n) return;
            // fade out & slide left, then change text, then from right -> visible
            gsap.to(n, {
                ...options.animation.pagination,
                opacity: 0,
                x: -3,
                onComplete: () => {
                    n.textContent = String(index + 1);
                    gsap.fromTo(
                        n,
                        { opacity: 0, x: 3 },
                        { ...options.animation.paginationIn, opacity: 0.7, x: 0 }
                    );
                }
            });
        };

        // small wrapper
        const updatePagination = () => {
            animatePaginationTo(currentIndex.current);
        };

        // --- reset draggables for the top two cards ---
        const resetDrags = () => {
            const t = Array.from(list.querySelectorAll<HTMLDivElement>(":scope > .list_item"));
            const top = t[0];
            const second = t[1];
            if (!top || !second) return;

            const cardA = top.querySelector<HTMLDivElement>(".item_card");
            const cardB = second.querySelector<HTMLDivElement>(".item_card");
            if (!cardA || !cardB) return;

            cardWidth = cardA.getBoundingClientRect().width;
            l_fullThreshold = cardWidth * options.fullThreshold;
            T_threshold = cardWidth * options.threshold;

            // kill previous draggables if any
            try {
                mainDrag?.kill?.();
            } catch (e) { }
            try {
                secondDrag?.kill?.();
            } catch (e) { }

            // create main draggable for top card
            mainDrag = Draggable.create(cardA, {
                type: "x",
                onPress() {
                    cardA.classList.add("is--dragging");
                },
                onRelease() {
                    cardA.classList.remove("is--dragging");
                },
                onDrag() {
                    let e = this.x as number;
                    if (Math.abs(e) > l_fullThreshold) {
                        const a = Math.abs(e) - l_fullThreshold;
                        e = (e > 0 ? 1 : -1) * (l_fullThreshold + a * options.overDragMultiplier);
                    }
                    gsap.set(cardA, { x: e, rotation: 0 });
                },
                onDragEnd() {
                    const e = this.x as number;
                    const dir = e > 0 ? "right" : "left";
                    // disable this draggable while second would be enabled later in original flow
                    this.disable?.();
                    if (Math.abs(e) <= T_threshold) {
                        gsap.to(cardA, { x: 0, rotation: 0, ...animationBeforeRelease, onComplete: w });
                    } else if (Math.abs(e) <= l_fullThreshold) {
                        v(dir, false, e);
                    } else {
                        v(dir, true);
                    }
                }
            })[0];

            // create draggable for the second card
            secondDrag = Draggable.create(cardB, {
                type: "x",
                onPress() {
                    cardB.classList.add("is--dragging");
                },
                onRelease() {
                    cardB.classList.remove("is--dragging");
                },
                onDrag() {
                    let e = this.x as number;
                    if (Math.abs(e) > l_fullThreshold) {
                        const a = Math.abs(e) - l_fullThreshold;
                        e = (e > 0 ? 1 : -1) * (l_fullThreshold + a * options.secondCardOverDragMultiplier);
                    }
                    gsap.set(cardB, { x: e, rotation: 0 });
                },
                onDragEnd() {
                    gsap.to(cardB, { x: 0, rotation: 0, ...animationBeforeRelease });
                }
            })[0];

            mainDrag?.enable?.();
            secondDrag?.disable?.();

            // local helpers to re-run after drags
            function w() {
                list?.querySelectorAll<HTMLDivElement>(".item_card.is--dragging").forEach((t) => {
                    t.classList.remove("is--dragging");
                });
                // set up drags again for new top/second
                resetDrags();
            }

            // v() and w() are placed below in outer scope in original flow — but we can keep them here for closure access
        };

        // --- slide direction handler (left = forward, right = backward) ---
        const v = (tDir: "left" | "right", force = false, b = 0) => {
            const t = Array.from(list.querySelectorAll<HTMLDivElement>(".list_item"));

            if (tDir === "left") {
                const g = t[0];
                if (!g) return;
                const e = g.querySelector<HTMLDivElement>(".item_card");
                const a = -l_fullThreshold;
                currentIndex.current = (currentIndex.current + 1) % totalItems.current;
                updatePagination();

                if (!e) {
                    // fallback DOM-only rotate
                    list.appendChild(g);
                    setupStack();
                    resetDrags();
                    return;
                }

                if (force) {
                    const u = gsap.getProperty(e, "x") as number;
                    list.appendChild(g);
                    [activeRotation, inactiveRotation] = [inactiveRotation, activeRotation];
                    setupStack();
                    gsap.fromTo(
                        e,
                        { x: u, rotation: 0 },
                        { x: 0, rotation: 0, ...animationAfterRelease, onComplete: () => resetDrags() }
                    );
                } else {
                    gsap.fromTo(
                        e,
                        { x: b, rotation: 0 },
                        {
                            x: a,
                            ...animationBeforeRelease,
                            onComplete() {
                                gsap.set(e, { x: 0, rotation: 0 });
                                list.appendChild(g);
                                [activeRotation, inactiveRotation] = [inactiveRotation, activeRotation];
                                setupStack();
                                // animate entry of the moved card's internal card for the feeling of continuity
                                const u = g.querySelector<HTMLElement>(".item_card");
                                if (u) {
                                    gsap.fromTo(u, { x: a }, { x: 0, ...animationAfterRelease, onComplete: () => resetDrags() });
                                } else {
                                    resetDrags();
                                }
                            }
                        }
                    );
                }
            } else if (tDir === "right") {
                const gAll = Array.from(list.querySelectorAll<HTMLDivElement>(".list_item"));
                if (gAll.length === 0) return;
                const eEl = gAll[0];
                const uEl = gAll[gAll.length - 1];
                if (!eEl || !uEl) return;

                currentIndex.current = (currentIndex.current - 1 + totalItems.current) % totalItems.current;
                updatePagination();

                // if b is non-zero (dragX passed) we follow a slightly different animation path — keep basic behavior consistent
                if (typeof b === "number" && b !== 0) {
                    const $a = b;
                    const aEl = eEl.querySelector<HTMLElement>(".item_card");
                    const rEl = uEl.querySelector<HTMLElement>(".item_card");
                    const I = l_fullThreshold;
                    const L = -l_fullThreshold;
                    if (!aEl || !rEl) {
                        // fallback structural change
                        list.insertBefore(uEl, list.firstChild);
                        list.insertBefore(eEl, list.children[1] || null);
                        setupStack();
                        resetDrags();
                        return;
                    }

                    gsap.fromTo(
                        aEl,
                        { x: $a, rotation: 0 },
                        {
                            x: I,
                            ...animationBeforeRelease,
                            onComplete: () => {
                                list.insertBefore(uEl, list.firstChild);
                                [activeRotation, inactiveRotation] = [inactiveRotation, activeRotation];
                                setupStack();
                                list.insertBefore(eEl, list.children[1] || null);

                                gsap.fromTo(
                                    rEl,
                                    { x: 0, rotation: 0 },
                                    {
                                        x: L,
                                        ...animationBeforeRelease,
                                        onComplete: () => {
                                            let P = 0;
                                            function A() {
                                                P++;
                                                if (P === 2) resetDrags();
                                            }
                                            gsap.to(rEl, {
                                                x: 0,
                                                rotation: 0,
                                                ...animationAfterRelease,
                                                onComplete: A
                                            });
                                            gsap.to(aEl, {
                                                x: 0,
                                                rotation: 0,
                                                ...animationAfterRelease,
                                                onComplete: A
                                            });
                                        }
                                    }
                                );

                                gsap.set(aEl, { x: I, rotation: 0 });
                            }
                        }
                    );
                } else {
                    // simple structural reverse rotate
                    list.insertBefore(uEl, list.firstChild);
                    list.insertBefore(eEl, list.children[1] || null);
                    gsap.fromTo(
                        uEl.querySelector<HTMLElement>(".item_card")!,
                        { x: 0, rotation: 0 },
                        {
                            x: -l_fullThreshold,
                            ...animationBeforeRelease,
                            onComplete: () => {
                                [activeRotation, inactiveRotation] = [inactiveRotation, activeRotation];
                                setupStack();
                                gsap.to(uEl.querySelector<HTMLElement>(".item_card")!, {
                                    x: 0,
                                    rotation: 0,
                                    ...animationAfterRelease,
                                    onComplete: () => resetDrags()
                                });
                            }
                        }
                    );
                }
            }
        };

        // w() used in original — remove drag class and reset drags
        function w() {
            list?.querySelectorAll<HTMLDivElement>(".item_card.is--dragging").forEach((t) => {
                t.classList.remove("is--dragging");
            });
            resetDrags();
        }

        // initialize stack + draggables
        setupStack();
        resetDrags();

        // attach button controls
        const onNext = () => v("left");
        const onPrev = () => v("right");
        nextBtn?.addEventListener("click", onNext);
        prevBtn?.addEventListener("click", onPrev);

        // keyboard support (debounced simple)
        if (options.enableKeyboard) {
            let last = 0;
            const handler = (ev: KeyboardEvent) => {
                const now = Date.now();
                if (now - last < options.keyboardDebounce) return;
                last = now;
                if (ev.key === "ArrowLeft") {
                    ev.preventDefault();
                    v("right");
                } else if (ev.key === "ArrowRight") {
                    ev.preventDefault();
                    v("left");
                }
            };
            document.addEventListener("keydown", handler);
            _handleKeydown.current = handler;
        }

        // Magnetic button hover effect (initMagneticEffect)
        const initMagneticEffect = () => {
            if (!options.enableMagnet) return;
            const E = [prevBtn, nextBtn].filter(Boolean) as HTMLButtonElement[];
            const pointerFine = window.matchMedia("(pointer: fine)").matches;
            if (!E.length || !pointerFine) return;

            const killTweens = (o: HTMLElement | null) => {
                if (!o) return;
                gsap.killTweensOf(o);
                gsap.set(o, { x: "0px", y: "0px", rotate: "0deg", clearProps: "all" });
            };

            const onEnter = (ev: MouseEvent) => {
                const c = ev.currentTarget as HTMLElement;
                killTweens(c);
            };

            const onMove = (ev: MouseEvent) => {
                const c = ev.currentTarget as HTMLElement;
                if (getComputedStyle(c).pointerEvents === "none") return;
                const d = c.getBoundingClientRect();
                const i = options.magneticStrength;
                const r = d.width * i;
                const m = d.height * i;
                const y = ((ev.clientX - d.left) / d.width - 0.5) * 2 * r;
                const x = ((ev.clientY - d.top) / d.height - 0.5) * 2 * m;
                gsap.to(c, {
                    x: `${y}px`,
                    y: `${x}px`,
                    rotate: "0.001deg",
                    ease: options.magneticPowerEase,
                    duration: options.magneticDuration
                });
            };

            const onLeave = (ev: MouseEvent) => {
                const c = ev.currentTarget as HTMLElement;
                gsap.to(c, {
                    x: "0px",
                    y: "0px",
                    ease: options.magneticEase,
                    duration: options.magneticDuration,
                    clearProps: "all"
                });
            };

            E.forEach((btn) => {
                btn.addEventListener("mouseenter", onEnter);
                btn.addEventListener("mousemove", onMove);
                btn.addEventListener("mouseleave", onLeave);
                // store handlers on the element to remove later (we'll remove by reusing same closures — it's fine)
            });

            // cleanup function returns a remover
            return () => {
                E.forEach((btn) => {
                    btn.removeEventListener("mouseenter", onEnter);
                    btn.removeEventListener("mousemove", onMove);
                    btn.removeEventListener("mouseleave", onLeave);
                    gsap.killTweensOf(btn);
                    gsap.set(btn, { x: "0px", y: "0px", clearProps: "all" });
                });
            };
        };

        const cleanupMagnet = initMagneticEffect();

        // cleanup at unmount
        return () => {
            try {
                mainDrag?.kill?.();
            } catch (e) { }
            try {
                secondDrag?.kill?.();
            } catch (e) { }

            nextBtn?.removeEventListener("click", onNext);
            prevBtn?.removeEventListener("click", onPrev);

            if (_handleKeydown.current) {
                document.removeEventListener("keydown", _handleKeydown.current);
                _handleKeydown.current = null;
            }

            if (cleanupMagnet) cleanupMagnet();

            // clear any GSAP tweens on list elements to avoid leaked animations
            gsap.killTweensOf(list);
            list.querySelectorAll("*").forEach((el) => gsap.killTweensOf(el));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    return (
        <section data-cid="cards-swiper" data-js data-js-loaded="false" data-js-mounted="false" id="block_fb3d960de403d41574f07c6f2b647246" className="block-cards-swiper  -offset-block-rtl-ltr c-cards-swiper u-default" style={{ "--block-color-text": "#7ce0f6", "--block-color-accent": "#7ce0f6", "--block-color-background": "#10162d" } as React.CSSProperties}>
            <div className="block_inner u-container u-container--pad inview-trigger" style={{}}>
                <hgroup className="hgroup">
                    <div className="hgroup_heading inview-element u-wysiwyg-text--1">A day at Wickside
                    </div>
                </hgroup>
                <div className="stack-cards inview-element" data-stacked-cards>
                    <div className="control">
                        <button ref={prevBtnRef} className="control_btn u-disable-button -prev" data-cursor="default" data-stacked-cards-control="right" aria-label="Previous card" data-magnetic-inner-target>
                            <svg className="btn_icon" xmlns="http://www.w3.org/2000/svg" width="202" height="235" fill="none" viewBox="0 0 202 235">
                                <path fill="#7CE0F6" d="M81.81 13.15 94.626.335l101.656 101.657-6.66 6.66 11.39.017.023 18.149-11.723-.017 6.05 6.05-101.36 101.36-12.852-12.852 94.578-94.578-175.335-.256-.023-18.149 176.926.258L81.811 13.15Z" />
                            </svg>
                        </button>
                    </div>
                    <div ref={containerRef} className="stack">
                        <div className="before"></div>
                        <div className="collection">
                            <div ref={listRef} className="collection_list">
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">6:00</div>
                                        <div className="card_caption">Watch the sunrise ripple across the canal from your balcony.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:768/h:1024/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_1-scaled.jpg" decoding="async" width="768" height="1024" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_1-scaled.jpg" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">7:00</div>
                                        <div className="card_caption">Morning run through Victoria Park while the city slowly stirs.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317816.png" decoding="async" width="740" height="984" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317816.png" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">8:00</div>
                                        <div className="card_caption">Coffee brewed, emails checked, bike ready for the short ride.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317817.png" decoding="async" width="740" height="984" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317817.png" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">12:00</div>
                                        <div className="card_caption">Grab lunch and sunlight at a local independent café terrace.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:740/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317818.png" decoding="async" width="740" height="984" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317818.png" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">15:00</div>
                                        <div className="card_caption">Break from work: browse the market, peek inside a gallery.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:741/h:984/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317819.png" decoding="async" width="741" height="984" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/08/Frame-1321317819.png" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">17:00</div>
                                        <div className="card_caption">Home again. Pause. Feed your plants. Kick off your shoes.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:768/h:1024/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_6-scaled.jpg" decoding="async" width="768" height="1024" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_6-scaled.jpg" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">18:00</div>
                                        <div className="card_caption">Yoga on the rooftop garden as golden hour rolls in.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:768/h:1024/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_7-scaled.jpg" decoding="async" width="768" height="1024" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_7-scaled.jpg" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">19:00</div>
                                        <div className="card_caption">Dinner with neighbours at the microbrewery two minutes away.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:768/h:1024/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_8-scaled.jpg" decoding="async" width="768" height="1024" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_8-scaled.jpg" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">20:00</div>
                                        <div className="card_caption">Live music by the water, laughter spilling into the night.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:768/h:1024/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_9-scaled.jpg" decoding="async" width="768" height="1024" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_9-scaled.jpg" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                                <div className="list_item">
                                    <div className="item_card">
                                        <div className="card_title">22:00</div>
                                        <div className="card_caption">Wind down to canal stillness, city lights glinting beyond.</div>
                                        <img data-opt-src="https://mlk2eo8xdoqk.i.optimole.com/w:768/h:1024/q:mauto/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_10-scaled.jpg" decoding="async" width="768" height="1024" src="https://mlk2eo8xdoqk.i.optimole.com/w:350/h:468/q:mauto/dpr:1.6/f:best/https://wicksidelife.com/wp-content/uploads/2025/07/ADAW_10-scaled.jpg" className="card_img img-crop focal-point-image" alt="" style={{ "objectPosition": "50% 50%", "--focal-point-left": 0.5, "--focal-point-top": 0.5 } as React.CSSProperties} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="control">
                        <button ref={nextBtnRef} className="control_btn u-disable-button -next" data-cursor="default" data-stacked-cards-control="left" aria-label="Next card" data-magnetic-inner-target>
                            <svg className="btn_icon" xmlns="http://www.w3.org/2000/svg" width="202" height="235" fill="none" viewBox="0 0 202 235">
                                <path fill="#7CE0F6" d="M81.81 13.15 94.626.335l101.656 101.657-6.66 6.66 11.39.017.023 18.149-11.723-.017 6.05 6.05-101.36 101.36-12.852-12.852 94.578-94.578-175.335-.256-.023-18.149 176.926.258L81.811 13.15Z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="pagination" role="status" aria-live="polite" aria-label="Slide navigation">
                    <div className="pagination_inner">
                        <span ref={paginationCurrentRef} className="pagination_current">1</span>
                        <span className="pagination_divider">/</span>
                        <span ref={paginationTotalRef} className="pagination_total">10</span>
                    </div>
                </div>
            </div>
            <div className="block_offset"></div>
        </section>
    )
}

export default CarsSwiper