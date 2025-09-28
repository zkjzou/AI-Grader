
"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "./logo.png"; 
import heroIllustration from "./character.png"; 


export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0fe3c2] flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 shadow-sm rounded-[50px] mt-6 mx-6 mb-6">

  <div className="flex items-center gap-3">
  <Link href="/">
    <Image src={logo} alt="logo" width={200} height={200} className="cursor-pointer" />
  </Link>

    <div className="flex items-center gap-2 ml-4 text-black/60 dark:text-white/60">
      <i className="fa-solid fa-gear cursor-pointer hover:text-black dark:hover:text-white"></i>
      <i className="fa-solid fa-ellipsis-vertical cursor-pointer hover:text-black dark:hover:text-white"></i>
    </div>
  </div>
</header>

      <main className="flex flex-1 items-center justify-center px-8">
        <div className="max-w-7xl w-full flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Grade Homework Faster with AI
            </h1>
            <p className="text-lg md:text-xl mb-6">
              Upload your assignments and rubrics, and get structured feedback automatically.
            </p>
            <Link href="start" className="inline-block bg-white text-[#0fe3c2] font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition">
              Start Grading
            </Link>
          </div>

<div className="flex-1 flex justify-center items-center">
  <Image
    src={heroIllustration}
    alt="Hero illustration"
    width={800}        
    height={800}      
    className="object-contain"
  />
</div>
        </div>
      </main>
    </div>
  );
}
