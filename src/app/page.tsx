"use client";

import { ChevronRight, Star, Clock, MapPin, Instagram, Menu as MenuIcon } from 'lucide-react';
import Image from 'next/image';

const HERO_IMAGE = "/_next/image?url=%2FC%3A%2FUsers%2FPICHAU%2F.gemini%2Fantigravity%2Fbrain%2Fdc60725e-b436-4221-be6d-9dfa715102c1%2Fconserva_hero_pizza_1768256070226.png&w=1080&q=75";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black selection:bg-orange-500/30 selection:text-orange-500 font-sans">
      {/* Navbar Glassmorphism */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-orange-500/20 text-white">C</div>
            <span className="text-xl font-bold tracking-tighter uppercase italic">Conserva</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#menu" className="hover:text-orange-500 transition-colors">Menu</a>
            <a href="#sobre" className="hover:text-orange-500 transition-colors">Nossa História</a>
            <a href="#contato" className="hover:text-orange-500 transition-colors">Contato</a>
          </div>

          <a href="/pos" className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-orange-600 transition-all shadow-lg active:scale-95">
            Área do Lojista
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-6 pt-20 overflow-hidden bg-gray-50/30">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center z-10">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-bold uppercase tracking-widest">
              <Star size={14} fill="currentColor" /> Inaugurada em Caputira
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tighter">
              A Pizza mais <br />
              <span className="text-orange-600 italic">Tradicional</span> <br />
              da Região.
            </h1>
            <p className="text-lg text-gray-500 max-w-md leading-relaxed font-medium">
              Ingredientes selecionados, massa artesanal de fermentação lenta e o sabor inconfundível do forno a lenha.
            </p>
            <div className="flex items-center gap-4">
              <button className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 shadow-2xl shadow-orange-500/30 transition-all active:scale-95 group">
                Peça Agora <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-2xl font-bold text-lg border border-black/5 hover:bg-white transition-all text-gray-700">
                Ver Cardápio
              </button>
            </div>
          </div>

          <div className="relative aspect-square animate-in fade-in zoom-in duration-1000">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl opacity-30"></div>
            <div className="relative h-full w-full rounded-[40px] overflow-hidden border border-black/5 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 pointer-events-none bg-white">
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop"
                alt="Pizza Hero"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Float Card */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-black/5 p-6 rounded-3xl shadow-2xl flex items-center gap-4 backdrop-blur-xl animate-bounce duration-[3000ms]">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600"><Clock size={24} /></div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">Aberto Agora</h4>
                <p className="text-xs text-green-600 font-bold italic uppercase tracking-tighter">Entrega em 30-45min</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Blocks */}
      <section className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        {[
          { icon: <MapPin />, title: "Onde Estamos", desc: "Av. Padre João Facundo, 34, Centro, Caputira - MG" },
          { icon: <Star />, title: "Qualidade Premium", desc: "Processo artesanal em cada detalhe do nosso preparo." },
          { icon: <Instagram />, title: "Siga-nos", desc: "@conserva.pizzaria para promoções diárias." }
        ].map((item, i) => (
          <div key={i} className="p-8 rounded-[32px] bg-white border border-gray-100 hover:border-orange-500/30 transition-all group shadow-sm hover:shadow-xl hover:shadow-orange-500/5">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl mb-6 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shadow-inner">
              {item.icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
            <p className="text-gray-500 leading-relaxed text-sm font-medium">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer Simples */}
      <footer className="border-t border-gray-100 py-12 px-6 text-center text-gray-400 font-medium">
        <p className="text-xs uppercase tracking-widest">© 2026 Restaurante e Pizzaria Conserva LTDA. CNPJ: 61.516.347/0001-86</p>
      </footer>
    </div>
  );
}
