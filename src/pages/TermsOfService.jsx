import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#08041A] text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-neon-purple/20 rounded-xl">
            <FileText className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Termos de Serviço</h1>
            <p className="text-gray-400 text-sm mt-1">Última atualização: 15 de julho de 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12 backdrop-blur-md">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">1. Aceitação dos Termos</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Ao acessar ou utilizar a plataforma **Toca Mais**, você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer termo estabelecido aqui, por favor, não utilize a plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">2. Descrição do Serviço</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              O Toca Mais é um ecossistema digital que conecta músicos/artistas, donos de bares/estabelecimentos e contratantes de eventos. A plataforma oferece ferramentas para agendamento de shows, criação de propostas comerciais, gestão de datas, publicidade de eventos ao vivo e integração com ferramentas de produtividade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">3. Integrações com Terceiros (Google Calendar)</h2>
            <p className="text-purple-300 font-semibold text-sm">Regras de Uso de Agenda e APIs:</p>
            <p className="text-gray-300 leading-relaxed text-sm">
              Nossa plataforma permite a integração direta com sua conta do Google para sincronização de calendários. Ao habilitar esta funcionalidade:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
              <li>Você concede permissão ao Toca Mais para criar, alterar e visualizar eventos em sua agenda do Google.</li>
              <li>A sincronização de agenda serve unicamente para fins de organização pessoal do usuário e prevenção de conflitos de datas (double-booking).</li>
              <li>Você compreende que é responsável por manter a conexão ativa e que o Toca Mais não se responsabiliza por eventuais falhas de conexão de rede ou interrupções das APIs do Google que impeçam a sincronização em tempo real.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">4. Responsabilidades do Usuário</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Você concorda em usar a plataforma apenas para fins lícitos e de acordo com as seguintes regras:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
              <li>Fornecer informações verdadeiras e atualizadas no momento do cadastro e criação de perfis de artistas ou estabelecimentos.</li>
              <li>Respeitar os acordos contratuais e valores definidos nas propostas fechadas através da plataforma.</li>
              <li>Não postar conteúdo ofensivo, difamatório, que infrinja direitos autorais ou que viole as leis vigentes.</li>
              <li>Zelar pela confidencialidade das credenciais de sua conta (login e senha).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">5. Limitação de Responsabilidade</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              O Toca Mais atua como facilitador de conexões. Não nos responsabilizamos pela conduta de artistas, donos de bares ou contratantes fora da plataforma, nem por cancelamentos de shows de última hora, falhas no pagamento combinado diretamente ou quaisquer danos decorrentes de eventos realizados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">6. Modificações nos Termos</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Reservamo-nos o direito de alterar estes Termos de Serviço a qualquer momento. Modificações importantes serão notificadas na plataforma ou por e-mail. A continuidade no uso dos serviços após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">7. Lei Aplicável</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa legal será resolvida no foro da comarca da sede do aplicativo.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
