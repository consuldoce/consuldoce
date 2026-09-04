import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigin = 'https://consuldoce.pages.dev'
const cors = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Vary': 'Origin',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors })
}

function temporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) throw new Error('Não autenticado')
    const token = authHeader.slice(7)
    const url = Deno.env.get('SUPABASE_URL')
    const anon = Deno.env.get('SUPABASE_ANON_KEY')
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !anon || !service) throw new Error('Configuração da função incompleta')

    const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const admin = createClient(url, service)
    const { data: authData, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authData.user) throw new Error('Sessão inválida')

    const { data: caller, error: callerError } = await admin.from('profiles').select('id,email,full_name,nif,role').eq('id', authData.user.id).single()
    if (callerError || !caller) throw new Error('Utilizador não encontrado')

    const body = await req.json()
    const action = String(body?.action || '')
    const clientId = String(body?.client_id || '')
    if (!clientId) throw new Error('Cliente não indicado')

    // Um cliente só pode eliminar a própria conta.
    if (action === 'delete_own_account') {
      if (caller.role === 'admin') throw new Error('A conta de administrador não pode ser eliminada por esta função')
      if (clientId !== authData.user.id) throw new Error('A conta indicada não corresponde à sessão atual')

      const { data: ownClient, error: ownClientError } = await admin.from('profiles').select('id,email,full_name,nif,role').eq('id', clientId).single()
      if (ownClientError || !ownClient) throw new Error('Conta não encontrada')
      const { error: snapshotError } = await admin.from('orders').update({
        client_name_snapshot: ownClient.full_name || '',
        client_email_snapshot: ownClient.email || '',
        client_nif_snapshot: ownClient.nif || '',
        client_id: null,
      }).eq('client_id', clientId)
      if (snapshotError) throw snapshotError
      const { error: deleteError } = await admin.auth.admin.deleteUser(clientId)
      if (deleteError) throw deleteError
      return json({ ok: true })
    }

    // Gestão de outros clientes: apenas administradores e nunca outras contas de admin.
    if (caller.role !== 'admin') throw new Error('Sem permissões de administrador')
    if (clientId === authData.user.id) throw new Error('A própria conta de administrador não pode ser gerida por esta função')

    const { data: client, error: clientError } = await admin.from('profiles').select('id,email,full_name,nif,role').eq('id', clientId).single()
    if (clientError || !client) throw new Error('Cliente não encontrado')
    if (client.role === 'admin') throw new Error('Contas de administrador não podem ser geridas por esta função')

    if (action === 'reset_password') {
      const password = temporaryPassword()
      const { error } = await admin.auth.admin.updateUserById(clientId, { password })
      if (error) throw error
      const { error: flagError } = await admin.from('profiles').update({ must_change_password: true }).eq('id', clientId)
      if (flagError) throw flagError
      return json({ ok: true, temporary_password: password })
    }

    if (action === 'delete_client') {
      // Preserve historical orders before deleting the Auth user/profile.
      const { error: snapshotError } = await admin.from('orders').update({
        client_name_snapshot: client.full_name || '',
        client_email_snapshot: client.email || '',
        client_nif_snapshot: client.nif || '',
        client_id: null,
      }).eq('client_id', clientId)
      if (snapshotError) throw snapshotError

      const { error: deleteError } = await admin.auth.admin.deleteUser(clientId)
      if (deleteError) throw deleteError
      return json({ ok: true })
    }

    throw new Error('Ação não suportada')
  } catch (e) {
    console.error('admin-client-management error', e)
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 200)
  }
})
