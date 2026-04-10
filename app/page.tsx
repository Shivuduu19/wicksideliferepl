'use client'
import Image from "next/image";
import Header from "./components/Header";
import Intro from "./components/Intro";
import { useEffect, useRef } from "react";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import Cursor from "./components/Cursor";
import { ReactLenis, useLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react';
import gsap from "gsap";

export default function Home() {
  const lenisRef = useRef<LenisRef>(null)
  useEffect(() => {
    (function () {
      const ivh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--ivh', `${ivh}px`);
    }
    )();
  }, [])
  const lenis = useLenis((lenis) => {
    // called every scroll
    console.log(lenis)
  })

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000)
    }

    gsap.ticker.add(update)

    return () => gsap.ticker.remove(update)
  }, [])
  return (
    <>
      <ReactLenis root options={{
        autoRaf: false, lerp: .1,
        duration: 1.2,
        anchors: !0,
      }} ref={lenisRef} />
      <Header />
      <main className="@container [container-name:main] [--cw:100vw] w-full">
        <Intro />
        <Hero />
        <Footer />
      </main>
      <Cursor />
      {/* <div className="w-full h-screen bg-green-500"></div> */}
    </>
  );
}
