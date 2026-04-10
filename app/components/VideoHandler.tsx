import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

interface VideoHandlerProps {
    /** Video source URL — supports .m3u8 or mp4 */
    src: string;
    /** Optional portrait source for responsive swap */
    srcPortrait?: string;
    /** Type of video — e.g. "hls" or "mp4" */
    videoType?: "hls" | "mp4";
    /** Attributes like autoplay, muted, loop, etc. */
    options?: {
        attributes?: string[];
    };
    /** Enable debug logs */
    debug?: boolean;
    /** Class name for outer container */
    className?: string;
    /** Styles for outer container */
    style?: React.CSSProperties;
}

/**
 * A dynamic video handler that mirrors the behavior of the `.js-video-handler`
 * block from the inspected site — creates a <video> tag and attaches an HLS stream.
 */
const VideoHandler: React.FC<VideoHandlerProps> = ({
    src,
    srcPortrait,
    videoType = "hls",
    options = { attributes: ["muted", "autoplay", "loop", "playsinline", "preload"] },
    debug = false,
    className = "",
    style,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Create a <video> element dynamically
        const video = document.createElement("video");
        videoRef.current = video;

        // Apply attributes from options
        options.attributes?.forEach((attr) => {
            if (attr === "preload") video.preload = "metadata";
            else (video as any)[attr] = true;
        });

        // For mobile Safari
        video.setAttribute("webkit-playsinline", "");

        // Add video element to container
        container.innerHTML = "";
        container.appendChild(video);

        // Select which source to use
        const isPortrait = window.innerHeight > window.innerWidth;
        const source = isPortrait && srcPortrait ? srcPortrait : src;

        if (debug) console.log("[VideoHandler] Using source:", source);

        // Handle HLS or normal video
        if (videoType === "hls" && Hls.isSupported()) {
            const hls = new Hls({
                debug,
                enableWorker: true,
            });
            hlsRef.current = hls;

            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (debug) console.log("[VideoHandler] HLS manifest loaded");
                video.play().catch((err) => {
                    if (debug) console.warn("[VideoHandler] Autoplay failed:", err);
                });
            });
        } else {
            // Fallback for browsers that support native HLS (like Safari)
            video.src = source;
            video.addEventListener("loadedmetadata", () => {
                video.play().catch((err) => {
                    if (debug) console.warn("[VideoHandler] Autoplay failed:", err);
                });
            });
        }

        // Cleanup on unmount
        return () => {
            if (debug) console.log("[VideoHandler] Cleaning up...");
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            video.pause();
            video.removeAttribute("src");
            video.load();
            container.innerHTML = "";
        };
    }, [src, srcPortrait, videoType, options, debug]);

    return (
        <div
            ref={containerRef}
            className={`background-video js-video-handler u-absolute-fill u-cover-object ${className}`}
            style={style}
            data-src={src}
            data-src-portrait={srcPortrait}
            data-video-type={videoType}
            data-video-options={JSON.stringify(options)}
        />
    );
};

export default VideoHandler;
