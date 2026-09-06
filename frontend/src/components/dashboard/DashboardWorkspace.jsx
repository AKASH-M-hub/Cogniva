import React, { useState, useEffect } from 'react';
import {
  Brain,
  ArrowRight,
  BookOpen,
  Search,
  MessageSquare,
  BarChart3,
  Sparkles,
  ChevronRight,
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  Zap
} from 'lucide-react';

// Custom Hexagon Brain Logo Component
function CognivaHexLogo({ lightText = false }) {
  return (
    <div className="flex items-center space-x-3.5 select-none">
      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
          <polygon
            points="50,4 93,25 93,75 50,96 7,75 7,25"
            fill="#EEF2FF"
            stroke="#4F46E5"
            strokeWidth="6"
          />
        </svg>
        <Brain className="w-5 h-5 text-indigo-600 absolute stroke-[2.2]" />
      </div>
      <div className="text-left">
        <div className={`font-black text-xl tracking-tight leading-none ${lightText ? 'text-white' : 'text-slate-900'}`}>
          COGNIVA
        </div>
      </div>
    </div>
  );
}

export default function DashboardWorkspace({ onProceed }) {
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Core Autonomous Modules of Cogniva Platform
  const agents = [
    {
      id: 'knowledge-hub',
      num: '01',
      title: 'Knowledge Hub',
      badge: 'Vector & Document Store',
      desc: 'Manages PDF uploads, semantic chunking, and ChromaDB vector indexing.',
      icon: BookOpen,
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      id: 'search-agent',
      num: '02',
      title: 'Data Scout',
      badge: 'Semantic Hybrid Search',
      desc: 'Retrieves relevant handbook context with cosine similarity scoring.',
      icon: Search,
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'response-agent',
      num: '03',
      title: 'Insight Desk',
      badge: 'Qwen 2.5 3B LLM Stack',
      desc: 'Synthesizes grounded answers backed by verified document citations.',
      icon: MessageSquare,
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-200'
    },
    {
      id: 'analytics',
      num: '04',
      title: 'Analytics',
      badge: 'Telemetry & Latency',
      desc: 'Monitors real-time search accuracy, evaluation metrics, and latency.',
      icon: BarChart3,
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ];


  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased select-none flex flex-col justify-between">

      {/* 1. CLEAN SAAS NAVBAR */}
      <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100/80 sticky top-0 z-50 px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between shadow-xs">
        <CognivaHexLogo />
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-6 sm:space-y-10">

        {/* 2. HERO SECTION */}
        <section className="bg-white border border-indigo-100 rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-xl shadow-indigo-500/5 relative overflow-hidden text-left">
          {/* Solid Background Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

          <div className="relative z-10 space-y-4 sm:space-y-6 max-w-4xl">
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Cogniva – <span className="text-indigo-600">Enterprise AI</span> Platform
              </h1>
              <p className="text-lg sm:text-2xl font-bold text-indigo-600 tracking-tight">
                Transforming Enterprise Knowledge into Dynamic Multi-Agent Intelligence
              </p>
            </div>

            <p className="text-slate-600 text-sm sm:text-lg font-medium leading-relaxed max-w-3xl">
              An Intelligent Multi-Agent platform that transforms enterprise knowledge into contextual insights, grounded responses and actionable intelligence.
            </p>
          </div>
        </section>

        {/* 3. INTERACTIVE 5 AGENTS SHOWCASE (CLEAN SAAS MARQUEE TICKER) */}
        <section className="space-y-4 text-left">

          {/* SAAS MARQUEE TICKER (SINGLE DISPLAY ROW) */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm overflow-hidden relative">
            {/* Edge Blur Fades */}
            <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            {/* Row 1: Left to Right Marquee */}
            <div className="overflow-hidden">
              <div className="animate-marquee-right space-x-3">
                {[...agents, ...agents, ...agents].map((agent, i) => {
                  const Icon = agent.icon;
                  const isHighlighted = (i % agents.length) === highlightIndex;
                  return (
                    <div
                      key={`r1-${i}`}
                      className={`inline-flex items-center space-x-2.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap select-none cursor-default transition-all duration-700 ${isHighlighted
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-105'
                        : 'bg-slate-50 text-slate-700 border border-slate-200/90 opacity-90'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isHighlighted ? 'text-white' : 'text-indigo-600'}`} />
                      <span>{agent.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isHighlighted
                        ? 'bg-white/20 text-white border-white/20'
                        : 'bg-indigo-100/70 text-indigo-700 border-indigo-200/50'
                        }`}>
                        {agent.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 4. VIBRANT INDIGO BOTTOM HERO CTA BANNER */}
        <section className="bg-indigo-600 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-2xl shadow-indigo-500/20 border border-indigo-500 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 sm:gap-8 w-full relative overflow-hidden text-left">
          <div className="space-y-2 relative z-10 flex-1">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Ready to use Cogniva?
            </h2>
            <p className="text-xs sm:text-base text-indigo-100 font-medium leading-relaxed max-w-2xl">
              Access Knowledge Hub, Data Scout, Insight Desk and Analytics right now.
            </p>
          </div>

          <div className="shrink-0 flex items-center relative z-10">
            <button
              onClick={() => onProceed('knowledge-hub')}
              className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-white hover:bg-slate-50 text-indigo-700 font-black text-sm rounded-2xl shadow-xl transition-all flex items-center space-x-3 cursor-pointer whitespace-nowrap group active:scale-98"
            >
              <span>Continue to Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 px-6 text-center text-xs font-semibold text-slate-500 space-y-1.5">
        <div className="flex items-center justify-center space-x-2 text-slate-700 font-bold">
          <span>Cogniva Platform</span>
          <span>•</span>
          <span className="text-indigo-600">Enterprise AI Engine</span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">
          © {new Date().getFullYear()} Cogniva. All rights reserved. Enterprise Knowledge Intelligence System.
        </p>
      </footer>

    </div>
  );
}


