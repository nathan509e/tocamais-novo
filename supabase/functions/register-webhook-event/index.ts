import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ASAAS_BASE = "https://api.asaas.com/v3"

serve(async (req) => {
  try {
    const apiKey = Deno.env.get("ASAAS_API_KEY")
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ASAAS_API_KEY not set" }), { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "access_token": apiKey,
      "User-Agent": "TocaMais/1.0",
    }
    const ourUrl = "https://byghtatgozsthshmxaem.supabase.co/functions/v1/asaas-webhook"
    let results: string[] = []

    // ── 1. Payment webhook: already registered, just verify ──
    {
      const listResp = await fetch(`${ASAAS_BASE}/webhooks`, { headers })
      const listData = listResp.ok ? await listResp.json() : { data: [] }
      const webhooks = listData.data || []
      const paymentW = webhooks.find((w: any) => w.url === ourUrl)
      results.push(`Payment webhook: ${paymentW ? `id=${paymentW.id}, events=[${(paymentW.events || []).join(",")}]` : "NOT FOUND"}`)
    }

    // ── 2. PIX webhook: list/create/update ──
    {
      const endpoints = [
        `${ASAAS_BASE}/pix/webhooks`,
        `${ASAAS_BASE}/pix/webhook`,
        `${ASAAS_BASE}/pix/webhook/config`,
        `${ASAAS_BASE}/pixConfig/webhook`,
      ]

      for (const ep of endpoints) {
        const resp = await fetch(ep, { headers, method: "GET" })
        const text = await resp.text()
        results.push(`GET ${ep} -> ${resp.status}: ${text.substring(0, 300)}`)
      }

      // Try creating
      const createEp = `${ASAAS_BASE}/pix/webhook`
      const createResp = await fetch(createEp, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: ourUrl,
          authorization: Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "",
          enabled: true,
        }),
      })
      const createText = await createResp.text()
      results.push(`POST ${createEp} -> ${createResp.status}: ${createText.substring(0, 500)}`)
    }

    return new Response(
      JSON.stringify({ message: "Check complete", results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
