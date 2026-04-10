import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const BackgroundVideo = ({
    landscapeSrc,
    portraitSrc,
    debug = false,
}: {
    landscapeSrc: string;
    portraitSrc?: string;
    debug?: boolean;
}) => {

    const containerRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Pick correct source based on orientation
    const getSource = () => {
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;
        return isPortrait && portraitSrc ? portraitSrc : landscapeSrc;
    };

    // Load the HLS or direct source
    useEffect(() => {
        const container = containerRef.current;
        const video = videoRef.current;
        if (!video || !container) return;

        const src = getSource();

        const initVideo = async () => {
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = src;
            } else if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
                video.addEventListener("canplay", handleReady, { once: true });
                return () => {
                    hls.destroy();
                };
            } else {
                console.warn("HLS not supported");
            }
        };

        const handleReady = () => {
            setIsReady(true);
            video.muted = true;
            video.play().catch(err => console.warn("Autoplay failed", err));
        };

        initVideo();
    }, [landscapeSrc, portraitSrc]);

    useEffect(() => {
        const handleOrientationChange = () => {
            const video = videoRef.current;
            if (video) video.src = getSource();
        };
        window.addEventListener("orientationchange", handleOrientationChange);
        return () => window.removeEventListener("orientationchange", handleOrientationChange);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.classList.toggle("has-video-ready", isReady);
        container.classList.toggle("has-video-paused", !isReady);
    }, [isReady]);
    return (
        <div
            ref={containerRef}
            className="background-video absolute inset-0 overflow-hidden"
        >
            <video
                ref={videoRef}
                className="object-cover object-center absolute inset-0 w-full h-full"
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
            />
        </div>
    )
}

export default BackgroundVideo