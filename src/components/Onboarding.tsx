import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ShieldAlert } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: "📍",
      title: "Be the Reporter",
      description: "See something happening around you? Post it. Photo, video, or text. You are on the ground — we are not.",
      tag: "REAL-TIME BROADCASTS"
    },
    {
      icon: "✅",
      title: "Verify the Truth",
      description: "Community decides what is real. Cap it if it is fake. Vouch it if you see it too. No editor needed.",
      tag: "CROWD VERIFICATION"
    },
    {
      icon: "⚡",
      title: "Hold Power Accountable",
      description: "Corruption, government failures, local injustice — post it anonymously. Your voice has reach. Their secrets do not.",
      tag: "DECRYPTED OPERATIONS"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div
      className="w-full h-screen bg-[#0A0A0A] flex flex-col justify-between p-6 text-white relative overflow-hidden"
      id="onboarding-container"
    >
      {/* Background neon green grids/glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] bg-[#39FF14]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[50%] bg-[#39FF14]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-center z-10 py-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-brand text-[#0A0A0A] text-[10px] font-mono font-black rounded tracking-widest uppercase">
            GRID
          </span>
          <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            INITIALIZATION
          </span>
        </div>
        {currentSlide < slides.length - 1 && (
          <button
            onClick={handleSkip}
            className="text-xs font-mono text-gray-500 hover:text-brand tracking-widest uppercase transition-colors cursor-pointer"
            id="onboarding-skip-btn"
          >
            Skip
          </button>
        )}
      </div>

      {/* Main Slide Carousel Section */}
      <div className="flex-1 flex items-center justify-center relative z-10 w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center text-center space-y-6 px-4"
            id={`onboarding-slide-${currentSlide}`}
          >
            {/* Big Icon Container with Pulse Glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-brand/10 rounded-full blur-2xl animate-pulse pointer-events-none" />
              <div className="w-24 h-24 rounded-3xl bg-[#111111] border-2 border-brand/20 flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(57,255,20,0.1)] relative z-10 select-none">
                {slides[currentSlide].icon}
              </div>
            </div>

            {/* Tag / Category */}
            <span className="text-[10px] font-mono font-black text-brand tracking-[0.25em] uppercase">
              {slides[currentSlide].tag}
            </span>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase leading-none">
              {slides[currentSlide].title}
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-400 font-sans leading-relaxed max-w-sm">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Operations Control Block */}
      <div className="z-10 py-6 flex flex-col items-center gap-6 shrink-0 max-w-md w-full mx-auto">
        {/* Navigation Dots */}
        <div className="flex items-center gap-2.5" id="onboarding-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === index ? "w-6 bg-brand shadow-[0_0_10px_rgba(57,255,20,0.4)]" : "w-2 bg-gray-800"
              }`}
              title={`Slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <div className="w-full">
          {currentSlide === slides.length - 1 ? (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-brand text-[#0A0A0A] font-black font-mono text-sm uppercase tracking-widest rounded-xl transition-all duration-300 hover:bg-[#39FF14] hover:scale-[1.02] shadow-[0_0_25px_rgba(57,255,20,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              id="onboarding-get-started-btn"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 shrink-0 stroke-[3]" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-[#111111] hover:bg-[#151515] text-white hover:text-brand border border-gray-800 hover:border-brand/30 font-black font-mono text-sm uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              id="onboarding-next-btn"
            >
              <span>Next Sector</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>

        {/* Powered and Secure watermark */}
        <div className="flex items-center gap-1 text-[8px] text-gray-600 font-mono uppercase tracking-widest">
          <ShieldAlert className="w-3 h-3 text-gray-600" />
          <span>GroundZero Core Operations</span>
        </div>
      </div>
    </div>
  );
}
