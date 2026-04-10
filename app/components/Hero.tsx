import React from 'react'
import ComingEarlymarq from './ComingEarlymarq'
import FsMedia from './FsMedia'
import PatternParallax from './PatternParallax'
import CaptionText from './CaptionText'
import MediaSwiper from './MediaSwiper'
import ClipMedia from './ClipMedia'
import CarsSwiper from './CarsSwiper'
import CardsShuffle from './CardsShuffle'
import CardsMarq from './CardsMarq'

const Hero = () => {
    return (
        <div className='relative z-3 mx-auto w-full max-w-full before:[clip-path:polygon(0_0,100%_25px,100%_100%,0%_100%)] before:content-[""] before:block before:inset-0 before:absolute before:w-full before:h-full before:bg-(--block-color-background,var(--base--background-color)) before:z-0'>
            <section className='z-3 mt-0 mb-[-25px] bg-transparent relative w-full h-auto'>
                <div className="ml-auto mr-auto w-full pl-(--container-padding,40px) pr-(--container-padding,40px) relative z- pt-[clamp(80.00px,calc(69.50px+2.50000cqw),110.00px)] pb-[clamp(81.00px,calc(69.10px+2.83333cqw),115.00px)]">

                    <h3 className="text-[max(2rem,min(1.33088rem+2.54902vw,3.625rem))] leading-[1em] overflow-visible relative [rotate:none] translate-x-0 text-pretty translate-y-0 opacity-100">
                        <p className="block">


                            Wickside brings together canal-side rental homes, green space, artist
                            studios and independent businesses to create a truly mixed community –
                            rooted in the area’s industrial past and designed for its creative future.
                        </p >
                    </h3>
                    <span className="bg-transparent opacity-0 pt-[30px] px-[30px] pb-[40px] pointer-events-none top-full left-full !fixed duration-[400ms] [transition-property:opacity,_transform,_visibility,_pointer-events] ease-in-out invisible w-[90vw] backdrop-filter backdrop-blur-[15px] rounded-[2px] block m-auto max-w-[300px] overflow-hidden -translate-x-1/2 -translate-y-1/2 scale-[0.6] origin-[center_center]" />

                </div>
                <div className='[clip-path: polygon(0_0,100%_var(--offset-block-corner-size),100%_100%,0_calc(100%-var(--offset-block-corner-size)))] before:bg-(--block-color-background,var(--base--background-color))  before:hidden before:inset-0 before:overflow-hidden before:h-full before:w-full before:z-1'></div>

            </section>

            <ComingEarlymarq text="Coming Early 2026" rotate={true} />
            <FsMedia />
            <PatternParallax />
            <CaptionText />
            <MediaSwiper />
            <ClipMedia />
            <CarsSwiper />
            <CardsShuffle />
            <CardsMarq />
            <ComingEarlymarq text="Register your interest today" rotate={false} />
        </div>
    )
}

export default Hero