import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autenticado')
    const token = authHeader.replace('Bearer ', '')
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const admin = createClient(url, service)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) throw new Error('Sessão inválida')

    const { order_id } = await req.json()
    if (!order_id) throw new Error('order_id obrigatório')

    const { data: profile } = await admin.from('profiles').select('id,full_name,email,nif,address,role').eq('id', userData.user.id).single()
    const { data: order, error: orderError } = await admin.from('orders').select('id,client_id,status,notes,created_at').eq('id', order_id).single()
    if (orderError || !order) throw new Error('Encomenda não encontrada')
    if (order.client_id !== userData.user.id && profile?.role !== 'admin') throw new Error('Sem permissão')

    const { data: client } = await admin.from('profiles').select('full_name,email,nif,address').eq('id', order.client_id).single()
    const { data: items, error: itemsError } = await admin.from('order_items').select('sku,product_name,quantity').eq('order_id', order_id).order('created_at')
    if (itemsError) throw itemsError

    const rows = (items ?? []).map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(i.sku)}</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(i.product_name)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right"><strong>${i.quantity}</strong></td></tr>`).join('')
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#201627"><h2>Nova encomenda Consuldoce</h2><p><strong>Encomenda:</strong> ${order.id}</p><p><strong>Data:</strong> ${new Date(order.created_at).toLocaleString('pt-PT')}</p><p><strong>Cliente:</strong> ${escapeHtml(client?.full_name ?? '')}<br><strong>NIF:</strong> ${escapeHtml(client?.nif ?? '')}<br><strong>Email:</strong> ${escapeHtml(client?.email ?? '')}<br><strong>Morada:</strong> ${escapeHtml(client?.address ?? '')}</p><table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:800px"><thead><tr><th style="text-align:left;padding:8px;background:#f5eef6">Ref.</th><th style="text-align:left;padding:8px;background:#f5eef6">Produto</th><th style="text-align:right;padding:8px;background:#f5eef6">Qtd.</th></tr></thead><tbody>${rows}</tbody></table>${order.notes ? `<p><strong>Observações:</strong><br>${escapeHtml(order.notes)}</p>` : ''}</body></html>`

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('RESEND_FROM')
    const to = Deno.env.get('ORDER_EMAIL_TO') || 'consuldoce@gmail.com'
    if (!resendKey || !from) throw new Error('RESEND_API_KEY e RESEND_FROM não configurados')

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: client?.email || undefined, subject: `Nova encomenda Consuldoce · ${order.id.slice(0,8)}`, html })
    })
    if (!response.ok) throw new Error(`Resend: ${await response.text()}`)
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c] as string))
}
