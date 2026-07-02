const fs = require('fs');
let c = fs.readFileSync('src/pages/artist/ArtistProfile.jsx', 'utf8');

console.log('Before: handleSaveWalletId =', c.includes('handleSaveWalletId'));

// 1. Add connectingAsaas state
c = c.replace(
  '  const [walletSaved, setWalletSaved] = useState(false);',
  '  const [walletSaved, setWalletSaved] = useState(false);\n  const [connectingAsaas, setConnectingAsaas] = useState(false);'
);

// 2. Replace handleSaveWalletId function
const oldFunc = `  const handleSaveWalletId = async () => {
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
  };`;

const newFunc = `  const handleConnectAsaas = async () => {
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
  };`;

if (c.includes(oldFunc)) {
  c = c.replace(oldFunc, newFunc);
  console.log('Replaced handleSaveWalletId -> handleConnectAsaas');
} else {
  console.log('ERROR: old function not found');
}

// 3. Replace the not-connected UI
const oldDesc = 'Conecte sua conta Asaas para receber gorjetas dos seus fãs automaticamente via PIX.';
const newDesc = 'Conecte sua conta Asaas para receber pagamentos. A plataforma criará uma subconta para você automaticamente.';
if (c.includes(oldDesc)) {
  c = c.replace(oldDesc, newDesc);
  console.log('Updated description text');
}

// 4. Replace the input + button section
const oldInput = `                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-bold block">Wallet ID do Asaas</label>
                  <input
                    type="text"
                    value={asaasWalletId}
                    onChange={e => setAsaasWalletId(e.target.value)}
                    placeholder="wal_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className={\`w-full p-2.5 rounded-xl border text-xs outline-none \${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }\`}
                  />
                  <p className={\`text-[10px] \${isDark ? 'text-gray-600' : 'text-gray-400'}\`}>
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
                      background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)',
                      border: 'none',
                    }}
                  >
                    <Wallet className="w-4 h-4" />
                    Conectar Conta Asaas
                  </button>
                  {walletSaved && (
                    <p className="text-[10px] text-neon-green text-center font-bold">✓ Wallet ID salvo com sucesso!</p>
                  )}
                </div>`;

const newButton = `                <button
                  onClick={handleConnectAsaas}
                  disabled={connectingAsaas}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)',
                    border: 'none',
                  }}
                >
                  <Wallet className="w-4 h-4" />
                  {connectingAsaas ? 'Conectando...' : 'Conectar Conta Asaas'}
                </button>
                {walletSaved && (
                  <p className="text-[10px] text-neon-green text-center font-bold">✓ Conta Asaas conectada com sucesso!</p>
                )}`;

if (c.includes(oldInput)) {
  c = c.replace(oldInput, newButton);
  console.log('Replaced input+button section');
} else {
  console.log('WARN: old input section not found, trying smaller match...');
  // Try replacing just the button part
  const oldBtn = `                    onClick={handleSaveWalletId}
                    disabled={!asaasWalletId.trim() || !asaasWalletId.trim().startsWith('wal_')}`;
  if (c.includes(oldBtn)) {
    console.log('Found button onClick, replacing...');
  }
}

// 5. Replace connected status
const oldConnected = `                  <span className="text-xs font-semibold text-neon-green">
                    Asaas Conectado
                  </span>`;
const newConnected = `                  <span className="text-xs font-semibold text-neon-green">
                    {artistProfile.asaas_account_status === 'pending_verification' 
                      ? 'Conta Criada — Aguardando Ativação' 
                      : 'Asaas Conectado'}
                  </span>`;
if (c.includes(oldConnected)) {
  c = c.replace(oldConnected, newConnected);
  console.log('Updated connected status');
}

// 6. Add warning after wallet display
const oldWallet = `                <p className={\`text-[10px] font-mono \${isDark ? 'text-gray-500' : 'text-gray-400'}\`}>
                  Wallet: {artistProfile.asaas_wallet_id}
                </p>
                <a`;
const newWallet = `                <p className={\`text-[10px] font-mono \${isDark ? 'text-gray-500' : 'text-gray-400'}\`}>
                  Wallet: {artistProfile.asaas_wallet_id}
                </p>
                {artistProfile.asaas_account_status === 'pending_verification' && (
                  <p className={\`text-[10px] \${isDark ? 'text-yellow-400' : 'text-yellow-600'}\`}>
                    ⚠️ Verifique seu email para ativar a conta Asaas.
                  </p>
                )}
                <a`;
if (c.includes(oldWallet)) {
  c = c.replace(oldWallet, newWallet);
  console.log('Added pending verification warning');
}

fs.writeFileSync('src/pages/artist/ArtistProfile.jsx', c, 'utf8');

console.log('\nAfter:');
console.log('  handleConnectAsaas:', c.includes('handleConnectAsaas'));
console.log('  handleSaveWalletId:', c.includes('handleSaveWalletId'));
console.log('  connectingAsaas:', c.includes('connectingAsaas'));
console.log('  asaas-create-subaccount:', c.includes('asaas-create-subaccount'));
console.log('  asaas_account_status:', c.includes('asaas_account_status'));
