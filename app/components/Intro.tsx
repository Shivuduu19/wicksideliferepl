'use client'
import React, { useRef } from 'react'
import { gsap } from "gsap";
import BackgroundVideo from './BackgroundVideo';



const Letter = ({ letter }: { letter: string }) => {

    const options = {
        headingAnimationDelay: 1,
        headingAnimationDuration: 2,
        headingStaggerDelay: .03,
        headingHoverScale: 1.2,
        headingHoverRotation: 5,
        headingShadow: "drop-shadow(-2px -3px 4px rgba(0, 0, 0, 0))",
        headingHoverShadow: "drop-shadow(-2px -3px 4px rgba(0, 0, 0, 0.05))",
        backgroundParallaxDistance: "-10%",
        backgroundOpacityEnd: .7,
        intersection: {
            threshold: .1,
            rootMargin: "0px"
        }
    }
    const headingRef = useRef<HTMLHeadingElement | null>(null);
    // Keep a timeline reference (so we can kill it later)
    const timelineRef = useRef<gsap.core.Timeline | null>(null);


    const handleMouseEnter = () => {
        const el = headingRef.current;
        if (!el) return;

        // Kill previous animation if active
        if (timelineRef.current) {
            timelineRef.current.kill();
        }

        const rotation = gsap.utils.random(
            -options.headingHoverRotation,
            options.headingHoverRotation
        );

        // Create a new GSAP timeline
        const tl = gsap.timeline();
        tl.to(el, {
            scale: options.headingHoverScale,
            rotationZ: rotation,
            filter: options.headingHoverShadow,
            ease: "power2.out",
            duration: 0.25,
            overwrite: "auto",
        });

        timelineRef.current = tl;
    };

    const handleMouseLeave = () => {
        const el = headingRef.current;
        if (!el) return;

        gsap.to(el, {
            scale: 1,
            rotationZ: 0,
            filter: "none",
            ease: "power2.inOut",
            duration: 0.25,
        });
    };



    return (
        <div ref={headingRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className='inline-block origin-[50%_100%] relative '>
            {letter}
        </div>
    )
}


const Word = ({ word }: { word: string }) => {
    return (
        <div className='relative inline-block perspective-[1000px]'>

            {
                word.split('').map((letter, index) => (
                    <Letter key={index} letter={letter} />
                ))
            }
        </div>
    )
}


const Intro = () => {
    return (
        <section className=' z-0 mb-[-25px] bg-transparent w-full h-auto relative block '>
            <div className='flex lg:items-end lg:justify-end lg:pt-[120px] lg:pb-[50px] h-[calc(calc(var(--ivh)*100)+30px)] min-h-fit pb-[260px] pt-[160px] z-3 relative px-[40px] mx-auto w-full'>
                <h1 className='lg:leading-[.8em] lg:text-right text-white text-[10.5rem] uppercase font-normal '>
                    <Word word='for' />
                    <Word word='the' />
                    <br />
                    <Word word='creatively' />
                    <br />
                    <Word word='curious' />
                </h1>
            </div>

            {/* left  */}

            <div className='lg:[clip-path:polygon(70%_0,100%_104px,98%_100%,0_100%,0_34px)] xsm:[clip-path:polygon(75%_0,100%_90px,94%_100%,0_100%,0_30px)] xsm:pb-[60px] xsm:pt-[70px] items-start flex bg-[#9786fa] text-white [clip-path:polygon(58%_0,100%_40px,100%_100%,0_100%,0_24px)] flex-col justify-center max-w-[422px] p-[40px] absolute left-0 bottom-0 gap-y-[max(20px,min(calc(20px+(30-20)*((100vw-420px)/(1440-420))),30px))] duration-500 transition-[clip-path] ease-[cubic-bezier(.34,1.56,.64,1)] w-full z-4'>
                <h2 className='text-[max(1.375rem,min(calc(1.375rem+(32-22)*((100vw-26.25rem)/(1440-420))),2rem))] leading-[1em] text-balance font-normal'>Find your next rental property in East London’s most creative new neighbourhood</h2>
                <div className='flex items-center wrap gap-[10px_15px] justify-start'>
                    <a href="" className='group flex items-center gap-[10px] duration-500 transition-transform ease-[cubic-bezier(.115,.965,.38,1.595)] font-normal relative text-left  hover:transform-[scale(1.06)] w-auto'>
                        <span className='inline-flex group-hover:bg-[#380921] group-hover:text-white items-center bg-white text-[#380921] text-[max(.625rem,min(calc(.625rem+(12-10)*((100vw-26.25rem)/(1440-420))),.75rem))] leading-[1em] tracking-[.2em] justify-center min-h-[36px] text-center uppercase transform-[background-color,color] w-full py-[4px] px-[16px]'>Explore wickside</span>
                        <div className='bg-white aspect-square inline-flex my-auto overflow-hidden py-[4px] px-[16px] relative w-[36px] h-[36px]'>
                            <svg
                                width={13}
                                height={14}
                                viewBox="0 0 13 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className='absolute m-auto inset-0 w-[13px] h-[14px] transition-transform duration-600 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:translate-x-[0%]  group-hover:translate-y-[0%] translate-x-[-400%] translate-y-[-400%]'
                            >
                                <path
                                    d="M0.0218896 1.76012L1.53389 0.224121L10.7739 9.46412L10.7739 0.536121L12.8379 2.60012L12.8379 13.0401L2.37389 13.0401L0.309889 11.0001L9.26189 11.0001L0.0218896 1.76012Z"
                                    fill="#003019"
                                />
                            </svg>
                            <svg
                                width={13}
                                height={14}
                                viewBox="0 0 13 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className='absolute m-auto inset-0 w-[13px] h-[14px] transition-transform duration-600 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:translate-x-[200%]  group-hover:translate-y-[200%] translate-x-[-200%] translate-y-[-200%]'
                            >
                                <path
                                    d="M0.0218896 1.76012L1.53389 0.224121L10.7739 9.46412L10.7739 0.536121L12.8379 2.60012L12.8379 13.0401L2.37389 13.0401L0.309889 11.0001L9.26189 11.0001L0.0218896 1.76012Z"
                                    fill="#003019"
                                />
                            </svg>
                            <svg
                                width={13}
                                height={14}
                                viewBox="0 0 13 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className='absolute m-auto inset-0 w-[13px] h-[14px] transition-transform duration-600 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:translate-x-[400%]  group-hover:translate-y-[400%] translate-x-0 translate-y-0'
                            >
                                <path
                                    d="M0.0218896 1.76012L1.53389 0.224121L10.7739 9.46412L10.7739 0.536121L12.8379 2.60012L12.8379 13.0401L2.37389 13.0401L0.309889 11.0001L9.26189 11.0001L0.0218896 1.76012Z"
                                    fill="#003019"
                                />
                            </svg>

                        </div>
                    </a>
                </div>
            </div>



            {/* hreo bg overlay  */}

            <div className='bg-black absolute opacity-0 top-0 left-0 w-full h-full z-2'></div>



            {/* video  */}

            <figure className='z-1 bg-[#003019] absolute top-0 left-0 w-full h-full'>
                <div className='bg-[rgb(0_0_0_0.15)] pointer-events-none z-1 absolute top-0 left-0 w-full h-full'></div>
                <BackgroundVideo landscapeSrc="https://player.vimeo.com/external/1105186788.m3u8?s=e361b6c87b8fcca76a03dec762edb6903d2638c4&logging=false" portraitSrc="https://player.vimeo.com/external/1105395284.m3u8?s=74682852d91ce19a0570741eab51ae191065885d&logging=false" />
            </figure>



            {/* bg  */}
            <div className='bg-[#00be21] block absolute inset-0 w-full h-full z-0 [content:""]'></div>


        </section>
    )
}

export default Intro