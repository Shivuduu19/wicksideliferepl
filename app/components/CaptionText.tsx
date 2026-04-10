import React from 'react'

const CaptionText = () => {
    return (
        <section className='z-3 relative'>
            <div className='w-full relative z-1 pt-[clamp(76.00px,calc(64.10px+2.83333cqw),110.00px)] pb-[clamp(76.00px,calc(64.10px+2.83333cqw),110.00px)] px-(--container-padding,40px)'>
                <h4 className='text-[max(2rem,min(calc(2rem+(58-32)*((100vw-26.25rem)/(1440-420))),3.625rem))] leading-[1em] relative text-pretty '>
                    <p>
                        Where creative lives unfold between the canal and the city – with space to grow, places to gather, and East London’s most exciting scene for food, music and more.
                    </p>
                </h4>
            </div>
            <div className='[clip-path:polygon(0_0,100%_0,100%_100%,0_calc(100%-25px))] absolute bg-[#fcfbfb]  z-0 w-full h-full inset-0'></div>
        </section>
    )
}

export default CaptionText