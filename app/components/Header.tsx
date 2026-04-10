"use client";
import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";

interface ScrollOptions {
    thresholdHasScrolled: number;
    thresholdHasScrolledToggleVisibility: number;
    thresholdHasScrolledChangedDirection: number;
}

interface HeaderSimpleProps {
    debug?: boolean;
}

const Header = ({ debug = false }: HeaderSimpleProps) => {
    const logoRef = useRef<HTMLAnchorElement | null>(null);
    const scrollCleanupRef = useRef<(() => void) | null>(null);
    const lenis = useLenis()
    console.log(lenis);


    const options: ScrollOptions = {
        thresholdHasScrolled: 100,
        thresholdHasScrolledToggleVisibility: 700,
        thresholdHasScrolledChangedDirection: 10,
    };

    // Debug logger (same logic as original)
    const log = (msg: string, data?: any) => {
        debug && console.log(`[HeaderSimple] ${msg}`, data ?? "");
    };

    // Query logo once mounted
    useEffect(() => {
        const el = document.querySelector(".header_logo") as HTMLAnchorElement | null;
        if (el) {
            logoRef.current = el;
            log("Logo found");
        } else {
            log("Logo not found");
        }
    }, []);

    // Scroll direction + attribute setting logic
    useEffect(() => {
        let lastY = 0;

        const handleScroll = () => {
            const y = window.scrollY;

            if (Math.abs(lastY - y) >= options.thresholdHasScrolledChangedDirection) {
                const direction = y > lastY ? "down" : "up";
                document.body.setAttribute("data-scrolling-direction", direction);

                const scrolledStart = y > options.thresholdHasScrolled;
                document.body.setAttribute("data-scrolling-started", scrolledStart ? "true" : "false");

                const toggleVisibility = y > options.thresholdHasScrolledToggleVisibility;
                document.body.setAttribute(
                    "data-scrolling-toggle-visibility",
                    toggleVisibility ? "true" : "false"
                );

                lastY = y;
            }
        };

        window.addEventListener("scroll", handleScroll);
        scrollCleanupRef.current = () => {
            window.removeEventListener("scroll", handleScroll);
            log("Scroll listener removed");
        };

        log("Scroll direction detection initialized");

        return () => {
            scrollCleanupRef.current && scrollCleanupRef.current();
        };
    }, [debug]);

    // Logo click → scroll to top (Lenis global)
    useEffect(() => {
        const el = logoRef.current;
        if (!el) return;

        if (document.body.classList.contains("home")) {
            const onClick = (ev: MouseEvent) => {
                ev.preventDefault();
                // ✅ keep original global dependency behaviour
                // @ts-ignore
                console.log(lenis);

                // lenis.scrollTo(0);

                log("Logo clicked → scrollTo(0)");
            };

            el.addEventListener("click", onClick);

            return () => {
                el.removeEventListener("click", onClick);
            };
        }
    }, [debug]);
    return (
        <header className='bg-transparent flex pointer-events-none fixed top-0 left-0 right-0 w-full  z-9997 transition-opacity duration-300 '>
            <div className='lg:h-[125px] flex items-center justify-between h-[107px] relative transition-[height,opacity,transform] duration-[.4s,.2s,.2s] ease-[cubic-bezier(.115,.965,.38,1.595),ease-out,ease-out] px-[40px] mx-auto w-full'>
                <a ref={logoRef} className=' [--logo-width:216px] [--logo-height:73px]  flex-[0_0_var(--logo-width)] my-auto max-w-(--logo-width) justify-start pointer-events-auto w-(--logo-width) h-(--logo-height) duration-[.4s_.4s_.2s] transition-[flex-basis_max-width_transform_width] items-center inline-flex relative '>
                    <svg
                        width={197}
                        height={67}
                        viewBox="0 0 197 67"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className='absolute top-0 left-0 w-full h-full duration-200 transition-transform ease-[cubic-bezier(.115,.965,.38,1.595)] z-2 hover:rotate-[4deg] hover:scale-[1.075]'
                    >
                        <path
                            d="M31.2345 66.113L14.0634 26.6862L10.4795 49.571L0.515625 48.0121L6.78151 8.00043L16.3866 6.76776L28.9323 35.5712L27.7369 17.3771L36.5147 13.6698L48.711 27.1989L44.6821 2.22855L54.639 0.623047L61.5014 43.1816L51.866 45.7612L38.7517 31.2138L40.8908 63.7689L31.2345 66.113Z"
                            fill="white"
                        />
                        <path
                            d="M86.6482 28.4291L87.6898 11.0854H95.4773L91.3878 36.2212H82.9129L81.1536 21.6063L79.4293 36.2212H71.0243L66.9697 11.0854H74.5801L75.6567 28.8252L77.7748 11.0854H84.5627L86.6459 28.4291H86.6482Z"
                            fill="white"
                        />
                        <path d="M103.33 36.2212H96.9385V11.0854H103.33V36.2212Z" fill="white" />
                        <path
                            d="M131.877 11.0854H140.101L134.678 20.6742L139.418 36.2235H131.733L130.764 27.5692L129.111 30.4773V36.2235H122.72V11.0854H129.111V22.3962L131.877 11.0854Z"
                            fill="white"
                        />
                        <path
                            d="M147.462 36.5803C144.852 36.5803 142.936 35.9815 141.715 34.7861C140.494 33.5884 139.884 31.8058 139.884 29.436L146.42 27.6767C146.229 29.1843 146.245 30.2073 146.474 30.7479C146.7 31.2861 147.138 31.5564 147.786 31.5564C148.144 31.5564 148.426 31.4073 148.629 31.1067C148.832 30.8085 148.934 30.4426 148.934 30.0115C148.934 29.3171 148.767 28.7369 148.431 28.2709C148.096 27.8048 147.66 27.4507 147.119 27.2106C146.581 26.9706 145.989 26.7446 145.341 26.5279C144.693 26.3135 144.043 26.0316 143.384 25.6844C142.724 25.3372 142.128 24.9061 141.59 24.3911C141.051 23.8761 140.613 23.1282 140.278 22.1471C139.942 21.1661 139.774 19.9917 139.774 18.6286C139.774 15.9232 140.462 13.9379 141.839 12.6679C143.216 11.4003 145.113 10.7642 147.532 10.7642C149.95 10.7642 151.698 11.398 152.919 12.6679C154.14 13.9379 154.751 15.7927 154.751 18.2348L148.179 19.994C148.324 19.2041 148.37 18.54 148.324 18.0017C148.275 17.4635 148.235 17.044 148.198 16.7458C148.163 16.4475 148.061 16.2261 147.893 16.0817C147.725 15.9372 147.588 15.8486 147.48 15.8114C147.373 15.7764 147.236 15.7578 147.068 15.7578C146.278 15.7578 145.882 16.3566 145.882 17.5543C145.882 18.272 146.05 18.8639 146.385 19.3323C146.721 19.7983 147.156 20.1641 147.695 20.4275C148.233 20.6908 148.827 20.9308 149.473 21.1452C150.118 21.3595 150.771 21.6368 151.43 21.97C152.087 22.3056 152.686 22.7297 153.227 23.2447C153.765 23.7596 154.203 24.5076 154.538 25.4886C154.874 26.4696 155.042 27.6441 155.042 29.0072C155.042 34.0591 152.516 36.585 147.464 36.585L147.462 36.5803Z"
                            fill="white"
                        />
                        <path d="M163.226 36.2212H156.834V11.0854H163.226V36.2212Z" fill="white" />
                        <path
                            d="M172.991 11.0854C178.57 11.0854 181.359 15.2751 181.359 23.6545C181.359 32.0339 178.57 36.2235 172.991 36.2235H165.952V11.0854H172.991ZM172.346 30.906H172.525C173.364 30.906 173.979 30.3864 174.375 29.3448C174.769 28.3032 174.967 26.4065 174.967 23.6522C174.967 20.8979 174.769 19.0011 174.375 17.9618C173.979 16.9202 173.364 16.4006 172.525 16.4006H172.346V30.9084V30.906Z"
                            fill="white"
                        />
                        <path
                            d="M189.797 26.4181V30.906H196.692V36.2212H183.405V11.0854H196.223V16.4006H189.797V21.1402H195.65V26.4181H189.797Z"
                            fill="white"
                        />
                        <path
                            d="M114.478 25.2742C114.473 26.3275 114.462 27.1733 114.445 27.8001C114.422 28.674 114.361 29.3986 114.266 29.9719C114.17 30.5474 114.038 30.9063 113.87 31.0484C113.702 31.1929 113.45 31.2628 113.117 31.2628C112.758 31.2628 112.488 31.1067 112.309 30.7968C112.129 30.4868 111.992 29.7785 111.896 28.6786C111.801 27.5788 111.752 25.9267 111.752 23.7223C111.752 21.5179 111.801 19.7913 111.896 18.6774C111.992 17.5636 112.129 16.8459 112.309 16.522C112.488 16.1981 112.758 16.0373 113.117 16.0373C113.453 16.0373 113.704 16.1096 113.87 16.254C114.038 16.3985 114.168 16.7574 114.266 17.3306C114.361 17.9038 114.422 18.6285 114.445 19.5023C114.462 20.1431 114.473 21.0076 114.478 22.0935L120.832 20.5952C120.672 17.4028 120.045 15.0097 118.952 13.4159C117.719 11.6193 115.774 10.7222 113.117 10.7222C107.97 10.7222 105.397 15.0563 105.397 23.72C105.397 32.3836 107.97 36.5756 113.117 36.5756C115.774 36.5756 117.719 35.6785 118.952 33.8819C120.038 32.2997 120.662 29.9276 120.83 26.7679L114.478 25.2695V25.2742Z"
                            fill="white"
                        />
                    </svg>

                </a>


                {/* right  */}
                <aside className="items-center inline-flex relative lg:gap-x-[23px] gap-x-[18px]  flex-[0_0_auto] justify-end mt-auto mb-auto pointer-events-auto text-right -translate-y-[7px] [transition-property:transform] ease-(--transition-exaggeration-ease) duration-400">
                    <a
                        href="https://www.instagram.com/wicksidelife/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="place-content-center justify-center inline-flex w-[23px] h-[23px] lg:w-[50px] lg:h-[50px] pointer-events-auto relative text-center rotate-0 scale-100 duration-300 ease-[inherit] z-1[transition-property:transform] hover:rotate-[4deg] hover:scale-[1.075]"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={35}
                            height={37}
                            fill="none"
                            viewBox="0 0 35 37"
                            className="m-auto inset-0 w-[35px] h-[35px] z-1 absolute lg:w-[35px] lg:h-[37px]"
                        >
                            <path
                                fill="#fff"
                                d="M35 28.394H10.602V9.093h14.639V24.22h4.88V4.918H5.722v27.65H25.24v4.176H.843v-36H35v27.65ZM15.482 13.268v10.951h4.88V13.268h-4.88Z"
                                className="duration-400 [transition-property:fill]"
                            />
                        </svg>
                    </a>
                    <a
                        href="/register/"
                        aria-label="Say hello"
                        target="_self"
                        className="appearance-none [box-shadow:none] outline-[none] select-none inline-flex font-normal justify-start m-0 !p-0 relative text-left no-underline w-auto pointer-events-auto items-center z-1 gap-x-[10px] duration-500 [transition-property:transform] !bg-transparent text-[max(0.4375rem, min(0.308824rem + 0.490196vw, 0.75rem))] hover:transform-[scale(1.06)] group"
                    >
                        <span className="items-center bg-white text-black inline-flex text-[max(0.625rem,min(0.573529rem+0.196078vw,0.75rem))] tracking-[.2em] leading-[1em] justify-center min-h-[36px] px-[16px] py-[4px] text-center scale-100 origin-[center_center] uppercase [transition-property:background-color,color] w-full group-hover:bg-[#10162d] group-hover:text-[#fff]">
                            Say hello
                        </span>
                    </a>
                </aside>



            </div>
        </header>
    )
}

export default Header