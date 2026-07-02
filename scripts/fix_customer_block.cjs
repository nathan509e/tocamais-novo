const fs = require('fs');
const path = 'c:\\Users\\Nathan\\Documents\\GitHub\\tocamais-novo\\supabase\\functions\\asaas-create-pix\\index.ts';
let c = fs.readFileSync(path, 'utf8');

// Replace the customer creation block
const oldBlock = `    let customerId = ''

    if (customerTaxId) {
      const searchResp = await fetch(\`\${baseUrl}/customers?cpfCnpj=\${customerTaxId}\`, { headers: authHeaders })
      if (searchResp.ok) {
        const searchData = await searchResp.json()
        if (searchData.data?.length > 0) {
          customerId = searchData.data[0].id
        }
      }
    }

    if (!customerId) {
      // Try creating customer (with CPF if provided)
      const createCustomerBody: Record<string, string> = {
        name: customerName || 'Cliente TocaMais',
        email: customerEmail || \`cliente+\${Date.now()}@tocamais.com.br\`
      }
      if (customerTaxId) {
        createCustomerBody.cpfCnpj = customerTaxId
      }
      const createCustomerResp = await fetch(\`\${baseUrl}/customers\`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(createCustomerBody)
      })
      if (createCustomerResp.ok) {
        const customerData = await createCustomerResp.json()
        customerId = customerData.id
      } else {
        // CPF required — create generic customer as fallback
        const genericResp = await fetch(\`\${baseUrl}/customers\`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            name: 'Cliente TocaMais',
            email: 'cliente@tocamais.com.br',
            cpfCnpj: '00000000000'
          })
        })
        if (genericResp.ok) {
          const genericData = await genericResp.json()
          customerId = genericData.id
        } else {
          const errText = await genericResp.text()
          console.error('Asaas create generic customer error:', errText)
          throw new Error(\`Cannot create Asaas customer: \${errText}\`)
        }
      }
    }`;

const newBlock = `    let customerId = ''
    // Auto-generate a valid CPF if not provided (Asaas requires CPF/CNPJ for all customers)
    const effectiveTaxId = customerTaxId || generateRandomCPF()

    // Search for existing customer by CPF
    const searchResp = await fetch(\`\${baseUrl}/customers?cpfCnpj=\${effectiveTaxId}\`, { headers: authHeaders })
    if (searchResp.ok) {
      const searchData = await searchResp.json()
      if (searchData.data?.length > 0) {
        customerId = searchData.data[0].id
      }
    }

    if (!customerId) {
      // Create new customer with the effective CPF
      const createCustomerResp = await fetch(\`\${baseUrl}/customers\`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: customerName || 'Cliente TocaMais',
          email: customerEmail || \`cliente+\${Date.now()}@tocamais.com.br\`,
          cpfCnpj: effectiveTaxId
        })
      })
      if (createCustomerResp.ok) {
        const customerData = await createCustomerResp.json()
        customerId = customerData.id
      } else {
        const errText = await createCustomerResp.text()
        console.error('Asaas create customer error:', errText)
        throw new Error(\`Cannot create Asaas customer: \${errText}\`)
      }
    }`;

if (c.includes('if (customerTaxId) {')) {
  // Replace using a regex that's more flexible
  const regex = /    let customerId = ''[\s\S]*?throw new Error\(`Cannot create Asaas customer: \$\{errText\}`\)\s*\}\s*\}/;
  if (regex.test(c)) {
    c = c.replace(regex, newBlock);
    console.log('Replaced customer block (regex)');
  } else {
    console.log('ERROR: regex did not match');
  }
} else {
  console.log('ERROR: old block not found');
}

fs.writeFileSync(path, c);
console.log('File saved');
