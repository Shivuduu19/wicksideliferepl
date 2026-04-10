import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hls from "hls.js";
import VideoHandler from "./VideoHandler";
import { log } from "console";
import BackgroundVideo from "./BackgroundVideo";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface VideoHandlerOptions {
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    // src: string;
}

const FsMedia: React.FC<VideoHandlerOptions> = ({
    autoplay = false,
    muted = true,
    loop = true,
    // src,
}) => {


    const options = {
        video: {
            autoplay: !1,
            muted: !1,
            controlButton: {
                playLabel: "PLAY",
                pauseLabel: "PAUSE",
                ariaLabel: "Toggle video playback"
            }
        },
        scrollTrigger: {
            animation: {
                duration: "+=100%",
                start: "center center",
                end: "+=100%"
            },
            pin: {
                duration: "+=150%",
                start: "center center",
                end: "+=150%"
            },
            clipPath: {
                start: "polygon(0 0, 100% 17px, 100% calc(100% - 11px), 0 100%)",
                end: "polygon(0 0, 100% 0px, 100% calc(100% - 0px), 0 100%)"
            }
        },
        resize: {
            debounceDelay: 200
        },
        intersection: {
            threshold: .1,
            rootMargin: "0px"
        }
    }
    const sectionRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [inView, setInView] = useState(false);

    // === VIDEO SETUP ===
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return
        videoRef.current = section?.querySelector("video");
        // console.log(videoRef.current);

        const video = videoRef.current;
        if (!section || !video) return;

        // // HLS setup for .m3u8 sources
        // if (Hls.isSupported() && src.endsWith(".m3u8")) {
        //     const hls = new Hls();
        //     hls.loadSource(src);
        //     hls.attachMedia(video);
        //     hls.on(Hls.Events.MANIFEST_PARSED, () => {
        //         if (autoplay) video.play().catch(() => { });
        //     });
        // } else {
        //     video.src = src;
        //     if (autoplay) video.play().catch(() => { });
        // }

        video.muted = muted;
        video.loop = loop;
        video.playsInline = true;

        // Control button
        const control = document.createElement("button");
        control.className = "media_control";
        control.setAttribute("aria-label", "Toggle video playback");
        control.innerHTML = `
      <div class="control_icon"></div>
      <div class="control_label">
        <span class="label_text -play">PLAY</span>
        <span class="label_text -pause">PAUSE</span>
      </div>
    `;
        const mediaInner = section.querySelector(".media_inner");
        if (mediaInner) mediaInner.appendChild(control);

        const playLabel = control.querySelector(".-play") as HTMLElement;
        const pauseLabel = control.querySelector(".-pause") as HTMLElement;

        const animateLabel = (showPlay: boolean) => {
            const show = showPlay ? playLabel : pauseLabel;
            const hide = showPlay ? pauseLabel : playLabel;
            gsap.to(hide, {
                y: -30,
                opacity: 0,
                duration: 0.25,
                ease: "power1.in",
                onComplete: () => { gsap.set(hide, { y: 30 }) },
            });
            gsap.to(show, {
                y: 0,
                opacity: 1,
                duration: 0.25,
                delay: 0.25,
                ease: "power1.out",
            });
        };

        const playVideo = () => {
            video.play();
            video.muted = false;
            section.classList.add("is-playing");
            section.classList.remove("is-paused");
            animateLabel(false);
        };

        const pauseVideo = () => {


            video.pause();
            video.muted = true;
            section.classList.remove("is-playing");
            section.classList.add("is-paused");
            animateLabel(true);
        };

        control.addEventListener("click", () => {


            video.paused ? playVideo() : pauseVideo();
        });

        // // click outside control
        // const media = section.querySelector(".media");
        // media?.addEventListener("click", (e) => {
        //     console.log('pssje');

        //     if (!(e.target as HTMLElement).closest(".media_control")) pauseVideo();
        // });

        // intersection observer
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setInView(entry.isIntersecting);
                    if (!entry.isIntersecting) pauseVideo();
                });
            },
            { threshold: 0.1 }
        );
        observer.observe(section);

        // // scrolltrigger
        // gsap.set(section.querySelector(".media"), {
        //     clipPath:
        //         "polygon(0 0, 100% 17px, 100% calc(100% - 11px), 0 100%)",
        // });

        // const tl = gsap.timeline({
        //     scrollTrigger: {
        //         trigger: section,
        //         start: "center center",
        //         end: "+=100%",
        //         scrub: true,
        //     },
        // });

        // tl.to(section.querySelector(".media"), {
        //     clipPath:
        //         "polygon(0 0, 100% 0px, 100% calc(100% - 0px), 0 100%)",
        //     ease: "none",
        // });

        // const pin = ScrollTrigger.create({
        //     trigger: section,
        //     start: "center center",
        //     end: "+=150%",
        //     pin: section.querySelector(".block_outer"),
        //     scrub: false,
        // });

        return () => {
            observer.disconnect();
            //     ScrollTrigger.getAll().forEach((s) => s.kill());
            //     pin.kill();
        };
    }, [autoplay, muted, loop]);

    // auto-pause on out of view
    useEffect(() => {
        if (!inView && videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
        }
    }, [inView]);

    useGSAP(() => {
        const section = sectionRef.current;
        if (!section) return;

        const blockInner = section.querySelector(".block_inner") as HTMLElement;
        const blockOuter = section.querySelector(".block_outer") as HTMLElement;
        const media = section.querySelector(".media") as HTMLElement;
        const mediaInner = section.querySelector(".media_inner") as HTMLElement;

        if (!blockInner || !blockOuter || !media || !mediaInner) return;

        let animationTimeline: gsap.core.Timeline | null = null;
        let pinTimeline: ScrollTrigger | null = null;

        const initScrollAnimations = () => {
            // Kill old timelines if any
            if (animationTimeline) animationTimeline.kill();
            if (pinTimeline) pinTimeline.kill();

            // === SCROLL-DRIVEN ANIMATION ===
            animationTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: options.scrollTrigger.animation.start,
                    end: options.scrollTrigger.animation.end,
                    scrub: true,
                    markers: false,
                },
                defaults: { ease: "none" },
            })


            animationTimeline.fromTo(
                media,
                { clipPath: options.scrollTrigger.clipPath.start },
                { clipPath: options.scrollTrigger.clipPath.end },
                0
            )
                .to(blockInner, { paddingBlock: "0px", paddingInline: "0px" }, 0)
                .to(mediaInner, { maxHeight: "calc(100% - 0px)", maxWidth: "calc(100% - 0px)" }, 0);;



            // === PINNING ===
            pinTimeline = ScrollTrigger.create({
                trigger: section,
                start: "center center",
                end: "+=150%",
                pin: blockOuter,
                scrub: false,
            });
        };

        initScrollAnimations();

        const handleResize = () => {
            requestAnimationFrame(() => {
                initScrollAnimations();
                ScrollTrigger.refresh();
            });
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            animationTimeline?.kill();
            pinTimeline?.kill();
        };
    }, []);


    return (
        <section
            ref={sectionRef}
            className='block-fs-media c-fs-media u-default has-video-ready is-paused'>
            <div className="block_outer relative w-full">
                <div
                    className="block_inner u-container u-container--pad"
                    style={{
                        paddingBlock: "clamp(40.00px, calc(40.00px + 0.00000cqw), 40.00px)"
                    }}
                >
                    <div className="block_inline">
                        <figure className="media">
                            <div className="media_inner">
                                <BackgroundVideo
                                    portraitSrc='https://player.vimeo.com/external/1117062972.m3u8?s=17308738ecd8416faba74d651acd6db86e8f75db&logging=false'
                                    landscapeSrc='https://player.vimeo.com/external/1110977881.m3u8?s=1354d2a2978f4ccedf57bd1de2a16163817e8fdb&logging=false'
                                />
                                {/* <VideoHandler
                                    src='https://player.vimeo.com/external/1110977881.m3u8?s=1354d2a2978f4ccedf57bd1de2a16163817e8fdb&logging=false'
                                    srcPortrait='https://player.vimeo.com/external/1117062972.m3u8?s=17308738ecd8416faba74d651acd6db86e8f75db&logging=false'
                                    videoType='hls'
                                    options={{ attributes: ['loop', 'playsinline', 'preload', 'webkit-playsinline'] }}
                                /> */}
                                {/* <div
                                    className="background-video js-video-handler u-absolute-fill u-cover-object"
                                    data-src="https://player.vimeo.com/external/1110977881.m3u8?s=1354d2a2978f4ccedf57bd1de2a16163817e8fdb&logging=false"
                                    data-video-type="hls"
                                    data-src-portrait="https://player.vimeo.com/external/1117062972.m3u8?s=17308738ecd8416faba74d651acd6db86e8f75db&logging=false"
                                    data-video-type-portrait="hls"
                                    data-video-options='{"attributes":["loop","playsinline"]}'
                                /> */}
                            </div>
                        </figure>
                    </div>
                </div>
                <div className="block_offset" />
            </div>

        </section>
    )
}

export default FsMedia