"use client";

import { Preloader } from "@/components/awa/preloader";
import { CustomCursor } from "@/components/awa/cursor";
import { Navbar } from "@/components/awa/navbar";
import { Hero } from "@/components/awa/hero";
import { Marquee } from "@/components/awa/marquee";
import { Portfolio } from "@/components/awa/portfolio";
import { Services } from "@/components/awa/services";
import { Process } from "@/components/awa/process";
import { About } from "@/components/awa/about";
import { Testimonials } from "@/components/awa/testimonials";
import { Courses } from "@/components/awa/courses";
import { Contact } from "@/components/awa/contact";
import { Footer } from "@/components/awa/footer";

export default function Page() {
  return (
    <>
      {/* Cinematic preloader (first visit only) */}
      <Preloader />

      {/* Custom cursor — desktop only */}
      <CustomCursor />

      {/* Subtle grain overlay for premium feel */}
      <div className="awa-grain" aria-hidden />

      <Navbar />

      <main className="flex-1 relative z-10">
        <Hero />
        <Marquee />
        <Portfolio />
        <Services />
        <Process />
        <About />
        <Testimonials />
        <Courses />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
