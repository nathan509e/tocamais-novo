// fix_artist_tip2.cjs - Replace processTipPayment with direct DB check
const fs = require('fs');
const p = 'c:\\Users\\Nathan\\Documents\\GitHub\\tocamais-novo\\src\\pages\\artist\\ArtistTip.jsx';
let c = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

// Replace processTipPayment with a simple manual check
const oldFunc = `  const processTipPayment = async (manualConfirm = false) => {
    if (!artistId || !pendingTipId) return;
    setRequesting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'asaas-process-tip',
        {
          body: {
            payment_id: pendingTipId,
            artist_id: artistId,
            amount: tipAmount,
            user_name: userName || 'Cliente',
            message: message || null,
            musica_id: selectedMusic?.id || null,
            musica_titulo: selectedMusic?.titulo || 'Pedido com Gorjeta',
            musica_artista: selectedMusic?.artista_nome || null,
            rating: rating || null
          }
        }
      );

      if (fnError) {
        if (manualConfirm) {
          await insertRequestDirectly();
          return;
        }
        console.error('Erro ao processar gorjeta:', fnError);
        alert('Erro ao confirmar pagamento: ' + fnError.message);
        return;
      }

      if (!data?.success) {
        if (manualConfirm) {
          await insertRequestDirectly();
          return;
        }
        alert('Erro: ' + (data?.error || 'Falha ao processar'));
        return;
      }

      setPixCreated(false);
      setPixQrCodeBase64('');
      setPixQrCode('');
      setPendingTipId(null);
      setStage(STAGE.FINAL_THANKS);
    } catch (e) {
      console.error('Error processing tip:', e);
      if (manualConfirm) {
        await insertRequestDirectly();
        return;
      }
      alert('Erro: ' + e.message);
    }
    setRequesting(false);
  };`;

const newFunc = `  const processTipPayment = async (manualConfirm = false) => {
    if (!artistId || !pendingTipId) return;
    setRequesting(true);
    try {
      // Check if webhook already confirmed the tip
      const { data, error } = await supabase
        .from('pending_tips')
        .select('status')
        .eq('id', pendingTipId)
        .single();

      if (data?.status === 'confirmed') {
        setPixCreated(false);
        setPixQrCodeBase64('');
        setPixQrCode('');
        setPendingTipId(null);
        setStage(STAGE.FINAL_THANKS);
      } else if (manualConfirm) {
        // Webhook hasn't matched yet — show a message
        alert('Pagamento ainda não confirmado pelo sistema. Aguarde alguns segundos e tente novamente.');
      }
    } catch (e) {
      console.error('Error checking tip:', e);
      alert('Erro ao verificar pagamento: ' + e.message);
    }
    setRequesting(false);
  };`;

if (c.includes(oldFunc)) {
  c = c.replace(oldFunc, newFunc);
  console.log('Replaced processTipPayment');
} else {
  console.log('WARNING: processTipPayment not found exactly');
}

// Restore \r\n
c = c.replace(/\n/g, '\r\n');

fs.writeFileSync(p, c, 'utf8');
console.log('Done!');
