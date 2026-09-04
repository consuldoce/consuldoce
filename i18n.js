(function(){
  const dict = {
    'Gestão empresarial inteligente':'智能企业管理', 'Administração':'管理', 'Catálogo':'目录', 'Minha conta':'我的账户', 'Carrinho':'购物车', 'Sair':'退出',
    '中文':'中文', 'PT':'PT', 'Entrar':'登录', 'Registar':'注册', 'Acesso seguro':'安全登录', 'Entrar no catálogo':'登录目录', 'Criar acesso de cliente':'创建客户账户',
    'Encomende a mercadoria disponível sem visualizar preços.':'订购现有商品，无需查看价格。', 'Registe os dados da sua empresa para começar.':'填写您的企业资料即可开始。',
    'Nome / empresa':'姓名 / 公司', 'NIF':'税号', 'Telemóvel':'手机', 'País e indicativo':'国家及区号', 'Endereço principal':'主要地址', 'Andar, lote, fração, porta, etc.':'楼层、地块、单元、门牌等', '(opcional)':'（可选）', 'Código postal':'邮政编码', 'Localidade postal':'邮政地区', 'País':'国家',
    'Pesquisar país…':'搜索国家…', 'Email':'电子邮箱', 'Palavra-passe':'密码', 'Criar conta':'创建账户', 'Esqueci-me da palavra-passe':'忘记密码', 'Catálogo privado B2B · Consuldoce':'B2B 私人目录 · Consuldoce',
    'Recuperação de acesso':'账户恢复', 'Indique o email da conta e enviaremos instruções para definir uma nova palavra-passe.':'请输入账户邮箱，我们会发送设置新密码的说明。', 'Enviar instruções':'发送说明', 'Voltar ao login':'返回登录',
    'Definir nova palavra-passe':'设置新密码', 'Escolha uma nova palavra-passe com pelo menos 8 caracteres.':'请输入至少 8 个字符的新密码。', 'Nova palavra-passe':'新密码', 'Confirmar palavra-passe':'确认密码', 'Guardar nova palavra-passe':'保存新密码',
    'Registo concluído':'注册完成', 'Conta registada com sucesso':'账户注册成功', 'A sua conta foi criada. Para concluir o registo, consulte o email enviado para o endereço indicado e clique no link de confirmação.':'您的账户已创建。请查看发送到您所填写邮箱的邮件，并点击确认链接以完成注册。',
    'Confirme o seu email':'请确认您的邮箱', 'Depois da confirmação poderá voltar a esta página e iniciar sessão.':'确认后，您可以返回此页面登录。', 'Se não encontrar o email, verifique também a pasta de spam.':'如果找不到邮件，请同时检查垃圾邮件文件夹。',
    'Voltar ao login':'返回登录', 'Os meus dados':'我的资料', 'Consulte e altere os dados associados à sua conta.':'查看和修改与您的账户关联的信息。', 'Dados da empresa e contacto':'企业与联系方式', 'Estas informações são usadas para identificação e contacto.':'这些信息用于身份识别和联系。',
    'Uma alteração do email pode exigir confirmação no novo endereço.':'修改邮箱后可能需要在新地址再次确认。', 'Guardar alterações':'保存更改', 'Dados atualizados com sucesso.':'资料更新成功。', 'As minhas moradas':'我的地址', 'Pode ter várias moradas. Uma delas deve estar sempre definida como predefinida.':'您可以保存多个地址，其中一个必须设为默认地址。', '+ Nova morada':'+ 新地址', 'Tornar predefinida':'设为默认', 'Editar':'编辑', 'Eliminar':'删除', 'Ainda não existem moradas guardadas.':'暂无已保存地址。',
    'Alterar palavra-passe':'修改密码', 'Confirmar nova palavra-passe':'确认新密码', 'Eliminar a minha conta':'删除我的账户', 'A eliminação da conta é permanente. As encomendas já efetuadas serão preservadas no histórico comercial, mas deixarão de estar associadas a uma conta ativa.':'账户删除后无法恢复。历史订单将保留，但不再关联有效账户。', 'Eliminar a minha conta':'删除我的账户',
    'Segurança da conta':'账户安全', 'Por motivos de segurança, a administração pediu-lhe para alterar a palavra-passe antes de continuar.':'出于安全原因，管理员要求您在继续之前修改密码。',
    'Produtos para encomenda':'可订购商品', 'Escolha as quantidades e envie a sua encomenda à Consuldoce. Os preços não são apresentados.':'选择数量并向 Consuldoce 提交订单。目录不显示价格。', 'As minhas encomendas':'我的订单', 'Pesquisar por produto, referência ou código de barras…':'按产品、编号或条形码搜索…', 'Todas as famílias':'所有类别', 'Apenas em stock':'仅显示有库存', 'Nome A–Z':'名称 A–Z', 'Família A–Z':'类别 A–Z', 'ID do produto':'产品编号',
    'Em stock':'有库存', 'Fora de stock':'缺货', 'Imagem do produto por adicionar':'待添加产品图片', 'Adicionar':'添加', 'Não foram encontrados produtos.':'未找到产品。', 'Ref.':'编号',
    'Encomendas':'订单', 'Produtos':'产品', 'Importar Excel':'导入 Excel', 'Clientes':'客户', 'Gerir catálogo, imagens, stock e encomendas.':'管理目录、图片、库存和订单。',
    'Importação Sage 50':'Sage 50 导入', 'Separe as duas operações: use Artigos quando quiser atualizar o catálogo e Stock quando quiser apenas atualizar existências.':'请分开执行两项操作：更新目录时使用“产品”，仅更新库存时使用“库存”。', 'Importar artigos':'导入产品', 'Atualizar stock':'更新库存', 'Selecionar ficheiro Excel':'选择 Excel 文件', 'Nenhum ficheiro selecionado.':'未选择文件。', 'Publicar automaticamente produtos normais':'自动发布普通产品', 'Importar / atualizar artigos':'导入 / 更新产品', 'Segurança:':'安全：', 'os preços e restantes campos comerciais do Excel não são publicados no catálogo.':'Excel 中的价格及其他商业字段不会发布到目录。',
    'Clientes':'客户', 'Dados necessários à identificação e faturação do cliente. A conta de administrador atualmente autenticada não pode ser eliminada.':'用于客户识别和开票的信息。当前登录的管理员账户不能删除。', 'Nome':'姓名', 'Email':'电子邮箱', 'Morada':'地址', 'Registo':'注册', 'Ações':'操作', 'Histórico':'历史订单', 'Reset password':'重置密码', 'Conta atual':'当前账户', 'Sem clientes.':'暂无客户。',
    'Histórico do cliente':'客户订单历史', 'Fechar':'关闭', 'Este cliente ainda não tem encomendas.':'该客户暂无订单。', 'Entrega:':'送货地址：', 'Obs.:':'备注：', 'Reset de palavra-passe':'密码重置', 'Reset concluído':'重置完成', 'O cliente terá de escolher uma nova palavra-passe no próximo login.':'客户下次登录时必须设置新密码。', 'Palavra-passe temporária':'临时密码', 'Comunique esta palavra-passe ao cliente por um canal seguro. Não a envie por email a partir desta página.':'请通过安全渠道将此密码告知客户。请勿从此页面通过电子邮件发送。',
    'Editar produto':'编辑产品', 'Novo produto':'新产品', 'Referência / SKU':'编号 / SKU', 'Família':'类别', 'Nome do produto':'产品名称', 'Descrição curta':'简短描述', 'Stock físico':'实际库存', 'Preço interno':'内部价格', 'Nunca apresentado ao cliente; usado apenas para ordenação.':'绝不会向客户显示；仅用于排序。', 'Unidade':'单位', 'URL da imagem':'图片 URL', 'Carregar imagem':'上传图片', 'Código de barras':'条形码', 'Opções':'选项', 'Publicar no catálogo':'发布到目录', 'Mostrar como Em stock e permitir encomenda':'显示为“有库存”并允许订购', 'Guardar produto':'保存产品',
    'Selecionar com imagem':'选择有图片的产品', 'Apagar imagens selecionadas':'删除所选图片', 'Eliminar produtos selecionados':'删除所选产品', 'Selecionar todos os visíveis':'选择所有可见产品', 'Produtos selecionados:':'已选择产品：', 'Ver imagem':'查看图片',
    'A atualizar dados…':'正在更新数据…', 'A apagar imagens…':'正在删除图片…', 'A eliminar produtos…':'正在删除产品…', 'A publicar produtos…':'正在发布产品…', 'A ocultar produtos…':'正在隐藏产品…', 'A carregar fotografias…':'正在上传图片…', 'Fotografias concluídas':'图片处理完成', 'Operação interrompida':'操作已中断', 'Operação concluída.':'操作完成。',
    'Não foi possível abrir a aplicação':'无法打开应用程序', 'Ocorreu um erro ao apresentar esta página. Recarregue e tente novamente.':'显示此页面时发生错误。请重新加载后重试。', 'Erro de carregamento':'加载错误', 'Não foi possível abrir o catálogo':'无法打开目录', 'A aplicação foi carregada, mas não conseguiu concluir a ligação ao serviço. Tente recarregar a página.':'应用程序已加载，但无法完成服务连接。请重新加载页面。',
    'Ligar o catálogo ao Supabase':'连接目录到 Supabase', 'Configure o URL e a chave pública do projeto Supabase em config.js.':'请在 config.js 中配置 Supabase 项目 URL 和公开密钥。', 'Não coloque a service_role key no navegador.':'请勿将 service_role key 放入浏览器。',
    'Não foi possível enviar o email de recuperação.':'无法发送恢复邮件。', 'Se o email estiver registado, receberá instruções para recuperar o acesso. Verifique também a pasta de spam.':'如果邮箱已注册，您将收到恢复账户的说明。请同时检查垃圾邮件文件夹。', 'Palavra-passe alterada. Já pode entrar com a nova palavra-passe.':'密码已修改。现在可以使用新密码登录。', 'Não foi possível alterar a palavra-passe.':'无法修改密码。', 'Sessão iniciada.':'登录成功。', 'Conta criada.':'账户已创建。', 'Já existe um cliente registado com este NIF.':'已有客户使用此税号注册。', 'Já existe uma conta registada com este email.':'已有账户使用此邮箱注册。', 'Não foi possível concluir.':'无法完成操作。',
    'A criar conta…':'正在创建账户…', 'Enviar email de redefinição':'发送密码重置邮件', 'A sua conta não tem permissões de administrador.':'您的账户没有管理员权限。', 'A sua própria conta de administrador não pode ser eliminada.':'不能删除您自己的管理员账户。', 'Cliente eliminado.':'客户已删除。', 'Não foi possível eliminar o cliente.':'无法删除客户。', 'Não foi possível fazer o reset.':'无法重置密码。',
    'Carrinho vazio.':'购物车为空。', 'Continuar a comprar':'继续购物', 'Finalizar encomenda':'提交订单', 'Quantidade':'数量', 'Remover':'移除', 'Notas':'备注', 'Morada de entrega':'送货地址', 'Selecionar morada':'选择地址', 'Encomenda enviada com sucesso.':'订单提交成功。',
    'Voltar':'返回', 'Guardar':'保存', 'Cancelar':'取消', 'Pesquisar':'搜索', 'Sim':'是', 'Não':'否', 'Estado':'状态', 'Data':'日期', 'Cliente':'客户', 'Total':'总计'
  };
  const replacements = Object.entries(dict).sort((a,b)=>b[0].length-a[0].length);
  function translateString(s){
    let out=s;
    for(const [pt,zh] of replacements){ if(out===pt) return zh; out=out.split(pt).join(zh); }
    out=out.replace(/Carrinho \((\d+)\)/g,'购物车 ($1)').replace(/Encomenda #/g,'订单 #');
    out=out.replace(/(\d+) produto(s)? selecionado(s)?/gi,'$1 个产品已选择').replace(/(\d+) imagens apagadas do armazenamento/g,'已从存储中删除 $1 张图片');
    return out;
  }
  function translatePage(){
    const isZh=localStorage.getItem('consuldoce_language')==='zh-CN';
    document.documentElement.lang=isZh?'zh-CN':'pt-PT';
    if(!isZh) return;
    const root=document.body;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{if(n.parentElement?.closest('#google_translate_element,script,style'))return; const v=n.nodeValue; const t=translateString(v); if(t!==v)n.nodeValue=t;});
    root.querySelectorAll('input,textarea,select,button,[title],[aria-label]').forEach(el=>{
      ['placeholder','title','aria-label'].forEach(a=>{if(el.hasAttribute(a)){const v=el.getAttribute(a),t=translateString(v);if(t!==v)el.setAttribute(a,t);}});
    });
  }
  window.CONSULDOCE_I18N={translatePage,dict};
  let scheduled=false;
  const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;translatePage()})});
  observer.observe(document.body,{childList:true,subtree:true});
})();
