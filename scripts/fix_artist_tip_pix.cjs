// fix_artist_tip.cjs - Rewrite ArtistTip.jsx state/polling for static PIX flow
const fs = require('fs');
const p = 'c:\\Users\\Nathan\\Documents\\GitHub\\tocamais-novo\\src\\pages\\artist\\ArtistTip.jsx';
let c = fs.readFileSync(p, 'utf8');

// Normalize
c = c.replace(/\r\n/g, '\n');

// 1. Rename pixPaymentId → pendingTipId everywhere
c = c.replace(/setPixPaymentId/g, 'setPendingTipId');
c = c.replace(/pixPaymentId/g, 'pendingTipId');
console.log('After rename, pendingTipId count:', (c.match(/pendingTipId/g)||[]).length);

// 2. Replace the polling useEffect
const oldPolling = `  useEffect(() => {
    if (!pixCreated || !pendingTipId) return;
    autoConfirmedRef.current = false;
    const checkPayment = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'asaas-check-payment',
          { body: { payment_id: pendingTipId } }
        );
        if (!fnError && data?.mpStatus === 'approved' && !autoConfirmedRef.current) {
          autoConfirmedRef.current = true;
          if (pollingRef.current) clearInterval(pollingRef.current);
          processTipPayment();
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };
    pollingRef.current = setInterval(checkPayment, 5000);
    checkPayment();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [pixCreated, pendingTipId]);`;

const newPolling = `  useEffect(() => {
    if (!pixCreated || !pendingTipId) return;
    autoConfirmedRef.current = false;
    const checkTip = async () => {
      try {
        const { data, error } = await supabase
          .from('pending_tips')
          .select('status')
          .eq('id', pendingTipId)
          .single();
        if (!error && data?.status === 'confirmed' && !autoConfirmedRef.current) {
          autoConfirmedRef.current = true;
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStage(STAGE.FINAL_THANKS);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };
    pollingRef.current = setInterval(checkTip, 3000);
    checkTip();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [pixCreated, pendingTipId]);`;

if (c.includes(oldPolling)) {
  c = c.replace(oldPolling, newPolling);
  console.log('Replaced polling useEffect');
} else {
  console.log('WARNING: polling useEffect not found, trying line-by-line...');
}

// 3. Replace the createPixPayment function to handle new response format
const oldResponse = `      setPixQrCodeBase64(data.pixQrCode);
      setPixQrCode(data.pixPayload);
      setPixPaymentId(data.paymentId);`;
const newResponse = `      setPixQrCodeBase64(data.pixQrCodeImage || '');
      setPixQrCode(data.pixQrCodePayload || data.pixKey);
      setPendingTipId(data.pendingTipId);`;

if (c.includes(oldResponse.replace(/setPixPaymentId/g, 'setPendingTipId'))) {
  c = c.replace(oldResponse.replace(/setPixPaymentId/g, 'setPendingTipId'), newResponse);
  console.log('Replaced response handler');
} else {
  console.log('WARNING: response handler not found');
}

// 4. Update createPixPayment body - add tip-specific fields
const oldBody = `          body: {
            amount: tipAmount,
            description: \`Gorjeta para \${artist?.artistic_name || 'Artista'} - TocaMais\`,
            customerName: userName || 'Cliente TocaMais',
            customerEmail: 'cliente@tocamais.com.br',
            customerTaxId: '', // Auto-generated on backend
            artistUserId: artistId
          }`;
const newBody = `          body: {
            amount: tipAmount,
            description: \`Gorjeta para \${artist?.artistic_name || 'Artista'} - TocaMais\`,
            artistUserId: artistId,
            userName: userName || 'Cliente',
            userMessage: message || null,
            musicaId: selectedMusic?.id || null,
            musicaTitulo: selectedMusic?.titulo || null,
            musicaArtista: selectedMusic?.artista_nome || null,
            rating: rating || null
          }`;

if (c.includes(oldBody)) {
  c = c.replace(oldBody, newBody);
  console.log('Replaced request body');
} else {
  console.log('WARNING: request body not found');
}

// Restore \r\n
c = c.replace(/\n/g, '\r\n');

fs.writeFileSync(p, c, 'utf8');
console.log('File written!');
