import sys

filepath = 'src/pages/artist/ArtistProfile.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add connectingAsaas state
old_state = '  const [walletSaved, setWalletSaved] = useState(false);'
new_state = '  const [walletSaved, setWalletSaved] = useState(false);\n  const [connectingAsaas, setConnectingAsaas] = useState(false);'
if old_state in content:
    content = content.replace(old_state, new_state, 1)
    print("1. Added connectingAsaas state")
else:
    print("1. WARN: state not found (maybe already added)")

# 2. Replace handleSaveWalletId with handleConnectAsaas
old_func = """  const handleSaveWalletId = async () => {
    if (!user || !asaasWalletId.trim()) return;
    setWalletSaved(false);
    try {
      const { error } = await supabase.from('artists').update({ asaas_wallet_id: asaasWalletId.trim() }).eq('user_id', user.id);
      if (error) throw error;
      setArtistProfile(prev => prev ? { ...prev, asaas_wallet_id: asaasWalletId.trim() } : prev);
      setWalletSaved(true);
      if (refreshProfile) refreshProfile();
      setTimeout(() => setWalletSaved(false), 3000);
    } catch (e) {
      console.error('Error saving wallet ID:', e);
      alert('Erro ao salvar Wallet ID: ' + e.message);
    }
  };"""

new_func = """  const handleConnectAsaas = async () => {
    if (!user) return;
    setWalletSaved(false);
    setConnectingAsaas(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-create-subaccount', {
        body: {}
      });
      
      if (error) throw error;
      
      if (data.success) {
        setArtistProfile(prev => prev ? { 
          ...prev, 
          asaas_wallet_id: data.walletId,
          asaas_account_status: data.accountStatus 
        } : prev);
        setWalletSaved(true);
        if (refreshProfile) refreshProfile();
      } else {
        throw new Error(data.error || 'Erro ao criar conta');
      }
    } catch (e) {
      console.error('Error connecting Asaas:', e);
      alert('Erro ao conectar conta Asaas: ' + (e.message || e));
    } finally {
      setConnectingAsaas(false);
    }
  };"""

if old_func in content:
    content = content.replace(old_func, new_func, 1)
    print("2. Replaced handleSaveWalletId with handleConnectAsaas")
else:
    print("2. WARN: old function not found exactly")
    # Debug: find what's around it
    idx = content.find('handleSaveWalletId')
    if idx >= 0:
        print(f"   Found at index {idx}")
        print(f"   Context: {repr(content[idx:idx+80])}")

# 3. Replace the UI section - wallet input → connect button
old_ui_not_connected = """            ) : (
              <div className="space-y-3">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Conecte sua conta Asaas para receber gorjetas dos seus fãs automaticamente via PIX.
                </p>
                <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Comissão: 30% TocaMais | 70% para você
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-bold block">Wallet ID do Asaas</label>
                  <input
                    type="text"
                    value={asaasWalletId}
                    onChange={e => setAsaasWalletId(e.target.value)}
                    placeholder="wal_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  />
                  <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Crie sua conta em{' '}
                    <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="text-neon-purple font-bold hover:underline">
                      asaas.com
                    </a>
                    {' '}e copie o Wallet ID em Integrações.
                  </p>
                  <button
                    onClick={handleSaveWalletId}
                    disabled={!asaasWalletId.trim() || !asaasWalletId.trim().startsWith('wal_')}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)',"""

if old_ui_not_connected in content:
    new_ui_not_connected = """            ) : (
              <div className="space-y-3">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Conecte sua conta Asaas para receber pagamentos. A plataforma criará uma subconta para você automaticamente.
                </p>
                <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Comissão: 30% TocaMais | 70% para você
                </p>
                <button
                  onClick={handleConnectAsaas}
                  disabled={connectingAsaas}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)','""
    content = content.replace(old_ui_not_connected, new_ui_not_connected, 1)
    print("3. Replaced UI section (part 1)")
else:
    print("3. WARN: old UI not found")

# 4. Replace the rest of the button (after the style prop)
old_button_rest = """                      border: 'none',
                    }}
                  >
                    <Wallet className="w-4 h-4" />
                    Conectar Conta Asaas
                  </button>
                  {walletSaved && (
                    <p className="text-[10px] text-neon-green text-center font-bold">✓ Wallet ID salvo com sucesso!</p>
                  )}
                </div>
              </div>"""

new_button_rest = """                      border: 'none',
                    }}
                  >
                    <Wallet className="w-4 h-4" />
                    {connectingAsaas ? 'Conectando...' : 'Conectar Conta Asaas'}
                  </button>
                  {walletSaved && (
                    <p className="text-[10px] text-neon-green text-center font-bold">✓ Conta Asaas conectada com sucesso!</p>
                  )}
                </div>
              </div>"""

if old_button_rest in content:
    content = content.replace(old_button_rest, new_button_rest, 1)
    print("4. Replaced button text and success message")
else:
    print("4. WARN: old button rest not found")

# 5. Replace the connected state to show status
old_connected = """            {artistProfile?.asaas_wallet_id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  <span className="text-xs font-semibold text-neon-green">
                    Asaas Conectado
                  </span>
                </div>
                <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Gorjetas: 30% TocaMais | 70% sua conta Asaas
                </p>
                <p className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Wallet: {artistProfile.asaas_wallet_id}
                </p>
                <a
                  href="https://www.asaas.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs font-bold text-neon-purple hover:underline`}
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver conta no Asaas
                </a>
              </div>"""

new_connected = """            {artistProfile?.asaas_wallet_id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  <span className="text-xs font-semibold text-neon-green">
                    {artistProfile.asaas_account_status === 'pending_verification' 
                      ? 'Conta Criada — Aguardando Ativação' 
                      : 'Asaas Conectado'}
                  </span>
                </div>
                <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Gorjetas: 30% TocaMais | 70% sua conta Asaas
                </p>
                <p className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Wallet: {artistProfile.asaas_wallet_id}
                </p>
                {artistProfile.asaas_account_status === 'pending_verification' && (
                  <p className={`text-[10px] ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    ⚠️ Verifique seu email para ativar a conta Asaas. Após ativação, você poderá receber pagamentos.
                  </p>
                )}
                <a
                  href="https://www.asaas.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs font-bold text-neon-purple hover:underline`}
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver conta no Asaas
                </a>
              </div>"""

if old_connected in content:
    content = content.replace(old_connected, new_connected, 1)
    print("5. Updated connected state UI")
else:
    print("5. WARN: old connected UI not found")

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("\nDone! Verifying...")
print(f"  handleConnectAsaas: {'handleConnectAsaas' in content}")
print(f"  handleSaveWalletId: {'handleSaveWalletId' in content}")
print(f"  connectingAsaas: {'connectingAsaas' in content}")
print(f"  asaas-create-subaccount: {'asaas-create-subaccount' in content}")
print(f"  asaas_account_status: {'asaas_account_status' in content}")
