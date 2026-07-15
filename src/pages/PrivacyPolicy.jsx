import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
            <Shield className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Política de Privacidade</h1>
            <p className="text-gray-400 text-sm mt-1">Última atualização: 15 de julho de 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12 backdrop-blur-md">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">1. Introdução</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Esta Política de Privacidade descreve como o **Toca Mais** ("nós", "nosso") coleta, utiliza, processa e protege as suas informações quando você utiliza nossa plataforma e serviços, incluindo a integração com serviços de terceiros, como o Google Calendar.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">2. Informações que Coletamos</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Coletamos informações necessárias para fornecer e melhorar nossos serviços de agendamento e conexão de artistas, proprietários de estabelecimentos e contratantes.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
              <li><strong>Dados de Registro:</strong> Nome, endereço de e-mail, número de telefone e senha.</li>
              <li><strong>Dados de Perfil:</strong> Biografia do artista, links de redes sociais, fotos de perfil, gênero musical e detalhes sobre seu cachê e shows.</li>
              <li><strong>Dados do Google Calendar (Opcional):</strong> Caso você opte por conectar sua agenda ao Google, poderemos ler, editar, criar e excluir eventos em sua agenda conectada.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">3. Uso de Dados do Google (Google User Data)</h2>
            <p className="text-purple-300 font-semibold text-sm">Importante para a Verificação do Google:</p>
            <p className="text-gray-300 leading-relaxed text-sm">
              Nossa integração com o Google Calendar tem como única finalidade sincronizar a agenda de eventos cadastrados no Toca Mais com a sua agenda pessoal do Google. 
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
              <li><strong>Como usamos:</strong> Criamos automaticamente eventos na sua agenda do Google para novos shows agendados na plataforma e verificamos sua disponibilidade para evitar conflitos de horário.</li>
              <li><strong>Armazenamento:</strong> Não armazenamos o conteúdo completo da sua agenda privada. Apenas mantemos os tokens de acesso OAuth necessários de forma criptografada e segura para realizar a sincronização automática em segundo tempo.</li>
              <li><strong>Compartilhamento:</strong> Nós **não vendemos, não alugamos e não compartilhamos** seus dados do Google com terceiros. Esses dados são estritamente utilizados no âmbito das funcionalidades de agendamento que você solicitou ativamente.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">4. Segurança dos Dados</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Implementamos medidas de segurança físicas, técnicas e organizacionais adequadas para proteger seus dados contra perda, roubo, acesso não autorizado, divulgação ou modificação. Seus dados de conexão OAuth com o Google são transmitidos via canais criptografados (SSL/HTTPS) e guardados em servidores seguros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">5. Controle do Usuário e Revogação</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Você pode, a qualquer momento:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
              <li>Desconectar sua conta do Google nas configurações de perfil do Toca Mais.</li>
              <li>Revogar totalmente o acesso concedido ao aplicativo Toca Mais diretamente pelo painel de controle da sua Conta do Google em <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">Configurações de Segurança do Google</a>.</li>
              <li>Solicitar a exclusão definitiva de sua conta do Toca Mais e todos os dados associados através de nosso canal de suporte.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-green-300">6. Contato</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato conosco através do e-mail: <span className="text-green-300">agenciaelostudio@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
