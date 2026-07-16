import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Music, Building2, Star, Play, Users, Check,
  Apple, ExternalLink
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/lib/supabaseClient";
import logoTocaMais from "@/assets/logo-tocamais.png";
import tableTent from "@/assets/table-tent.png";
import cantoraImg from "@/assets/Cantora.png";
import { motion } from "framer-motion";
import ParticleBackground from "@/components/shared/ParticleBackground";

// Modals - placeholders since they might be missing in target
const PremiumOfferModal = ({ open, onOpenChange }) => null;
const AuthRequiredDialog = ({ open, onOpenChange }) => null;
const EstablishmentPremiumModal = ({ open, onOpenChange }) => null;

const Landing = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [pendingRedirect, setPendingRedirect] = useState("/explore");
  const [showEstabPremiumModal, setShowEstabPremiumModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("ARTISTA PRO");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const landingLinks = [
    { label: "Recursos", id: "recursos" },
    { label: "Como funciona", id: "como-funciona" },
    { label: "Planos", id: "planos" },
    { label: "Dúvidas", id: "faq" },
  ];

  const handleLinkClick = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContinueFree = () => { setShowPremiumModal(false); navigate("/explore"); };
  const handleSelectPlan = (plan) => {
    setShowPremiumModal(false); setPendingPlan(plan); setPendingRedirect("/explore"); setShowAuthDialog(true);
  };
  const handleEstabContinueFree = () => { setShowEstabPremiumModal(false); navigate("/explore"); };
  const handleEstabSelectPlan = (plan) => {
    setShowEstabPremiumModal(false); setPendingPlan(plan); setPendingRedirect("/explore"); setShowAuthDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary animate-pulse" />
          <p className="text-sm font-medium text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Desktop header */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-20 z-50 bg-black/90 backdrop-blur-md border-b border-white/5 px-8 items-center">
        <div className="flex items-center gap-4 flex-1 pl-70">
          <div
            className="cursor-pointer flex items-center justify-center"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src={logoTocaMais} alt="Toca Mais Logo" className="h-14" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-10 flex-[2] relative">
          <div className="flex gap-10">
            {landingLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="text-xs font-black uppercase tracking-[0.2em] text-[#FFFFFF] hover:text-white/80 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 flex-1">
          <Link
            to="/login"
            className="px-8 py-3 bg-neon-purple rounded-xl text-xs font-black uppercase tracking-widest text-[#FFFFFF] hover:scale-105 transition-transform"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Mobile nav bar — Como funciona + Planos + Entrar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleLinkClick('como-funciona')}
            className="text-xs font-black uppercase tracking-[0.2em] text-[#FFFFFF] hover:text-white/80 transition-colors whitespace-nowrap py-3"
          >
            Como funciona
          </button>
          <button
            onClick={() => handleLinkClick('planos')}
            className="text-xs font-black uppercase tracking-[0.2em] text-[#FFFFFF] hover:text-white/80 transition-colors whitespace-nowrap py-3"
          >
            Planos
          </button>
        </div>
        <Link
          to="/login"
          className="px-6 py-3 bg-neon-purple rounded-xl text-xs font-black uppercase tracking-widest text-[#FFFFFF] active:scale-95 transition-transform whitespace-nowrap"
        >
          Entrar
        </Link>
      </div>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center pt-16 md:pt-24 bg-white text-black">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ParticleBackground className="absolute inset-0 z-0" />

          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[120px] bg-secondary" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial="hidden" animate="visible" className="max-w-xl relative z-20">

              <motion.h1 custom={1} variants={fadeIn} className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8 uppercase italic relative -top-8">
                O Palco <br />
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-green pr-8">
                  é todo seu
                </span>
              </motion.h1>

              <motion.p custom={2} variants={fadeIn} className="text-xl sm:text-2xl leading-relaxed mb-10 text-slate-600 font-medium">
                Pedidos de música e gorjetas via PIX sem instalar nada, contrate artistas, gestão de agenda de shows, curadoria e gestão musical para bares, tudo pelo celular.
              </motion.p>

              <motion.div custom={3} variants={fadeIn} className="flex flex-col sm:flex-row gap-4 mb-10 mt-24">
                <button
                  onClick={() => alert('Em breve na App Store')}
                  className="flex items-center justify-center gap-3 h-16 px-6 rounded-full bg-[#8A05FF] text-[#FFFFFF] font-black text-base shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Apple className="w-5 h-5" />
                  App Store
                </button>
                <button
                  onClick={() => alert('Em breve na Play Store')}
                  className="flex items-center justify-center gap-3 h-16 px-6 rounded-full bg-white text-[#8A05FF] font-black text-base border border-[#8A05FF]/10 shadow-lg shadow-purple-500/5 transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-[#8A05FF] text-[#8A05FF]" />
                  Play Store
                </button>
                <button
                  onClick={() => navigate("/explore")}
                  className="flex items-center justify-center gap-3 h-16 px-6 rounded-full bg-[#1A1A2E] text-[#FFFFFF] font-black text-base shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95"
                >
                  <ExternalLink className="w-5 h-5" />
                  Web App
                </button>
              </motion.div>



              <motion.div custom={5} variants={fadeIn} className="flex items-center gap-8 mt-12">
                {[
                  { value: "500+", label: "artistas" },
                  { value: "10k+", label: "pedidos/mês" },
                  { value: "4.9", label: "rating", icon: true },
                ].map((stat, i) => (
                  <div key={i} className={i > 0 ? "border-l border-slate-200 pl-8" : ""}>
                    <p className="text-2xl font-black flex items-center gap-1">
                      {stat.value}
                      {stat.icon && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            <div className="hidden lg:block" />
          </div>
        </div>

        <div className="absolute -bottom-24 right-[150px] hidden lg:block w-[800px] h-[1050px] z-10">
          <img src={cantoraImg} alt="Cantora" className="w-full h-full object-contain object-bottom" />
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section id="como-funciona" className="py-32 px-6 scroll-mt-16 bg-[#280c41] text-white relative z-20">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <p className="text-lg font-black uppercase tracking-[0.4em] text-white/80 mb-4">Experiência Única</p>
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-[#15EF82]">
            Conectando o Ecossistema Musical
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            { icon: Music, badge: "ARTISTA", title: "Sua Carreira no Próximo Nível", desc: "Receba gorjetas PIX, gerencie pedidos em tempo real e acompanhe seu crescimento com métricas profissionais." },
            { icon: Users, badge: "CLIENTE", title: "Parte do Show", desc: "Peça músicas, envie gorjetas e vote na playlist da noite direto do seu celular, sem baixar nenhum app." },
            { icon: Building2, badge: "BAR", title: "O Palco Ideal", desc: "Contrate talentos, aumente o engajamento do seu público e gerencie sua agenda de shows com facilidade." },
          ].map((item, i) => (
            <div key={i} className="p-10 rounded-[2.5rem] bg-gray-100 border border-gray-200 shadow-xl shadow-black/15 hover:shadow-2xl hover:shadow-black/25 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <item.icon className="w-8 h-8 text-neon-purple" />
              </div>
              <span className="text-xl font-black uppercase tracking-widest text-neon-purple mb-4 block drop-shadow-md">{item.badge}</span>
              <h3 className="text-2xl font-black mb-4 uppercase italic text-gray-900">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PLANOS ===== */}
      <section id="planos" className="relative py-32 bg-white/5 backdrop-blur-3xl scroll-mt-16 overflow-hidden">
        <ParticleBackground className="absolute inset-0 z-0" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">Planos para <span className="text-emerald-500">Evoluir</span></h2>
          <p className="text-slate-600 text-xl font-medium">Escolha a melhor opção para sua trajetória.</p>
        </div>

        <div className="relative z-10 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          {[
            { name: "GRÁTIS", price: "R$ 0", features: ["QR Code Único", "Pedidos Ilimitados", "Dashboard Básico", "Taxa de 20%"] },
            { name: "ARTISTA PRO", price: "R$ 49,90", popular: true, features: ["Destaque no Mapa", "100% das Gorjetas", "Suporte VIP"] },
            { name: "ESTABELECIMENTO", price: "R$ 149,90", features: ["Gestão Musical Completa", "Busca Inteligente por Artistas", "Contratação de Artistas", "Pagamento de Cache", "Curadoria Musical"] },
          ].map((plan, i) => {
            const isSelected = selectedPlan === plan.name;
            return (
              <div key={i} className={`p-12 rounded-[3rem] border ${isSelected ? "border-neon-purple bg-white text-black scale-105" : "border-white/10 bg-[#280c41] text-[#FFFFFF]"} flex flex-col`}>
                <h3 className="text-xl font-black uppercase tracking-widest mb-2">{plan.name}</h3>
                <div className="text-4xl font-black mb-8">{plan.price}<span className={`text-sm font-medium ${isSelected ? "text-black/70" : "text-[#FFFFFF]/70"}`}>/mês</span></div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-3 text-sm font-bold ${isSelected ? "text-black" : "text-[#FFFFFF]"}`}>
                      <Check className="w-5 h-5 text-neon-green" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isSelected ? "bg-emerald-500 text-[#FFFFFF]" : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"}`}
                >
                  Selecionar Plano
                </button>
              </div>
            );
          })}
        </div>
      </section>


      {/* ===== FAQ ===== */}
      <section id="faq" className="py-32 px-6 bg-[#280c41] text-white scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 text-[#FFFFFF]">Perguntas <span className="text-[#FFFFFF]">Frequentes</span></h2>
            <p className="text-white/80 font-medium">Tire suas dúvidas sobre a plataforma.</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "Como funciona o Toca Mais?", a: "O Toca Mais é uma plataforma que conecta artistas, fãs e estabelecimentos. Através de QR Codes em bares e eventos, os fãs podem pedir músicas, enviar gorjetas via PIX e participar de votações, tudo em tempo real." },
              { q: "Sou artista, como recebo meu cachê?", a: "Os artistas recebem gorjetas diretamente via PIX em suas contas configuradas. Para contratações via plataforma, o pagamento é gerenciado de forma segura, garantindo o recebimento após a realização do show." },
              { q: "O estabelecimento paga alguma taxa?", a: "Temos planos gratuitos e premium para estabelecimentos. No plano gratuito, há uma pequena taxa administrativa sobre as transações. Nos planos premium, o estabelecimento conta com gestão completa de agenda e curadoria musical." },
              { q: "Preciso baixar algum aplicativo?", a: "Não! O Toca Mais funciona diretamente no navegador do celular. Basta escanear o QR Code e você já está conectado ao show, sem precisar instalar nada." },
              { q: "Como faço para pedir uma música?", a: "Ao escanear o QR Code do artista ou do local, você acessa o repertório disponível. Basta escolher a música, confirmar (e opcionalmente adicionar uma gorjeta) e o pedido aparece instantaneamente para o artista." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-white/10 bg-white/5 rounded-2xl mb-4 px-6 shadow-lg shadow-black/10 hover:bg-white/10 transition-all">
                <AccordionTrigger className="text-left font-bold text-lg hover:text-white/80 transition-colors py-6 uppercase italic text-white">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/80 text-base pb-6 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== PHYSICAL EXPERIENCE ===== */}
      <section className="relative py-24 px-6 overflow-hidden">
        <ParticleBackground className="absolute inset-0 z-0" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >

              <img
                src={tableTent}
                alt="Toca Mais no seu bar"
                className="max-w-[450px] w-full h-auto drop-shadow-2xl origin-left mx-auto"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-xl"
            >
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-8 leading-[0.9]">
                Onde o Digital <br />
                <span className="text-[#15ef82]">Encontra o Palco</span>
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Transforme cada mesa em um ponto de interação. Com nossos displays físicos, seus clientes acessam o repertório e fazem pedidos em segundos, sem baixar nada.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Aumento imediato nas gorjetas",
                  "Engajamento total do público",
                  "Gestão simplificada de pedidos",
                  "Experiência premium para o cliente"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold uppercase italic text-sm tracking-widest drop-shadow-md">
                    <Check className="w-5 h-5 text-neon-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA BANNER ===== */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] bg-[#280c41] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
          >

            <div className="relative z-10 max-w-2xl text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-[#FFFFFF]">
                  Toca Mais
                </h3>
              </div>
              <p className="text-white/90 text-lg md:text-xl font-bold leading-tight">
                Um aplicativo criado para conectar os artistas da música ao-vivo com seu público durante o show, para receber pedidos e gorjetas.
              </p>
            </div>

            <button
              onClick={() => navigate("/explore")}
              className="relative z-10 h-16 px-10 rounded-2xl bg-white text-primary font-black text-lg uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
            >
              Fale com a gente
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-16 bg-[#0a090b] text-white text-center">
        <img src={logoTocaMais} alt="Toca Mais" className="h-16 w-auto mx-auto mb-6 opacity-80" />
        <div className="flex flex-wrap justify-center gap-6 mb-6 text-xs text-white/50">
          <Link to="/privacidade" className="hover:text-[#39FF6A] hover:underline transition-colors">
            Política de Privacidade
          </Link>
          <span className="text-white/20 select-none">•</span>
          <Link to="/termos" className="hover:text-[#39FF6A] hover:underline transition-colors">
            Termos de Serviço
          </Link>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60">
          © {new Date().getFullYear()} TOCAMAIS — O Palco é Todo Seu
        </p>
      </footer>
    </div>
  );
};

export default Landing;
