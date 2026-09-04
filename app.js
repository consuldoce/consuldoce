const cfg = window.CONSULDOCE_CONFIG || {};
let sb = null;
function initSupabase(){
  if(sb) return sb;
  const createClient = window.supabase?.createClient;
  if(typeof createClient !== 'function') throw new Error('O serviço de autenticação não foi carregado. Recarregue a página.');
  if(!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) throw new Error('A configuração do Supabase não está disponível.');
  sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  return sb;
}

const state = { session:null, profile:null, addresses:[], products:[], categories:[], cart:loadCart(), route:location.hash||'#/catalog', authMode:'login', adminTab:'orders', importMode:'articles', loading:false, recoveryFlow:false, selectedClientId:null, language:localStorage.getItem('consuldoce_language')||'pt', countryNames:[] };
const app = document.getElementById('app');
const toastEl = document.getElementById('toast');
const PHONE_COUNTRIES = [
  ['PT','🇵🇹','Portugal','+351'],['ES','🇪🇸','Espanha','+34'],['FR','🇫🇷','França','+33'],['DE','🇩🇪','Alemanha','+49'],['IT','🇮🇹','Itália','+39'],['GB','🇬🇧','Reino Unido','+44'],['IE','🇮🇪','Irlanda','+353'],['BE','🇧🇪','Bélgica','+32'],['NL','🇳🇱','Países Baixos','+31'],['LU','🇱🇺','Luxemburgo','+352'],['CH','🇨🇭','Suíça','+41'],['AT','🇦🇹','Áustria','+43'],['DK','🇩🇰','Dinamarca','+45'],['SE','🇸🇪','Suécia','+46'],['NO','🇳🇴','Noruega','+47'],['FI','🇫🇮','Finlândia','+358'],['IS','🇮🇸','Islândia','+354'],['PL','🇵🇱','Polónia','+48'],['CZ','🇨🇿','Chéquia','+420'],['SK','🇸🇰','Eslováquia','+421'],['HU','🇭🇺','Hungria','+36'],['RO','🇷🇴','Roménia','+40'],['BG','🇧🇬','Bulgária','+359'],['GR','🇬🇷','Grécia','+30'],['HR','🇭🇷','Croácia','+385'],['SI','🇸🇮','Eslovénia','+386'],['EE','🇪🇪','Estónia','+372'],['LV','🇱🇻','Letónia','+371'],['LT','🇱🇹','Lituânia','+370'],['CY','🇨🇾','Chipre','+357'],['MT','🇲🇹','Malta','+356'],['US','🇺🇸','Estados Unidos','+1'],['CA','🇨🇦','Canadá','+1'],['BR','🇧🇷','Brasil','+55'],['AR','🇦🇷','Argentina','+54'],['UY','🇺🇾','Uruguai','+598'],['CL','🇨🇱','Chile','+56'],['CO','🇨🇴','Colômbia','+57'],['MX','🇲🇽','México','+52'],['PE','🇵🇪','Peru','+51'],['VE','🇻🇪','Venezuela','+58'],['AO','🇦🇴','Angola','+244'],['MZ','🇲🇿','Moçambique','+258'],['CV','🇨🇻','Cabo Verde','+238'],['GW','🇬🇼','Guiné-Bissau','+245'],['ST','🇸🇹','São Tomé e Príncipe','+239'],['ZA','🇿🇦','África do Sul','+27'],['MA','🇲🇦','Marrocos','+212'],['DZ','🇩🇿','Argélia','+213'],['TN','🇹🇳','Tunísia','+216'],['EG','🇪🇬','Egito','+20'],['TR','🇹🇷','Turquia','+90'],['IL','🇮🇱','Israel','+972'],['AE','🇦🇪','Emirados Árabes Unidos','+971'],['SA','🇸🇦','Arábia Saudita','+966'],['IN','🇮🇳','Índia','+91'],['CN','🇨🇳','China','+86'],['JP','🇯🇵','Japão','+81'],['KR','🇰🇷','Coreia do Sul','+82'],['SG','🇸🇬','Singapura','+65'],['TH','🇹🇭','Tailândia','+66'],['ID','🇮🇩','Indonésia','+62'],['MY','🇲🇾','Malásia','+60'],['PH','🇵🇭','Filipinas','+63'],['AU','🇦🇺','Austrália','+61'],['NZ','🇳🇿','Nova Zelândia','+64'],['UA','🇺🇦','Ucrânia','+380'],['RS','🇷🇸','Sérvia','+381'],['BA','🇧🇦','Bósnia e Herzegovina','+387'],['AL','🇦🇱','Albânia','+355'],['ME','🇲🇪','Montenegro','+382'],['MK','🇲🇰','Macedónia do Norte','+389'],['XK','🇽🇰','Kosovo','+383'],['RU','🇷🇺','Rússia','+7']
];
function flag(code){return String(code||'').toUpperCase().replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt(0)))}
const ADDRESS_COUNTRIES = [["AF","Afeganistão"],["AX","Alanda"],["AL","Albânia"],["DE","Alemanha"],["AD","Andorra"],["AO","Angola"],["AI","Anguila"],["AQ","Antártida"],["AG","Antígua e Barbuda"],["AR","Argentina"],["DZ","Argélia"],["AM","Arménia"],["AW","Aruba"],["SA","Arábia Saudita"],["AU","Austrália"],["AZ","Azerbaijão"],["BS","Baamas"],["BD","Bangladeche"],["BB","Barbados"],["BH","Barém"],["BZ","Belize"],["BJ","Benim"],["BM","Bermudas"],["BY","Bielorrússia"],["BO","Bolívia"],["BW","Botsuana"],["BR","Brasil"],["BN","Brunei"],["BG","Bulgária"],["BF","Burquina Faso"],["BI","Burundi"],["BT","Butão"],["BE","Bélgica"],["BA","Bósnia e Herzegovina"],["CV","Cabo Verde"],["CM","Camarões"],["KH","Camboja"],["CA","Canadá"],["QA","Catar"],["KZ","Cazaquistão"],["TD","Chade"],["CL","Chile"],["CN","China"],["CY","Chipre"],["CZ","Chéquia"],["VA","Cidade do Vaticano"],["CO","Colômbia"],["KM","Comores"],["CG","Congo-Brazzaville"],["CD","Congo-Kinshasa"],["KP","Coreia do Norte"],["KR","Coreia do Sul"],["CR","Costa Rica"],["HR","Croácia"],["CU","Cuba"],["CW","Curaçau"],["CI","Côte d’Ivoire (Costa do Marfim)"],["DK","Dinamarca"],["DM","Domínica"],["EG","Egito"],["AE","Emirados Árabes Unidos"],["EC","Equador"],["ER","Eritreia"],["SK","Eslováquia"],["SI","Eslovénia"],["ES","Espanha"],["SZ","Essuatíni"],["US","Estados Unidos"],["EE","Estónia"],["ET","Etiópia"],["FJ","Fiji"],["PH","Filipinas"],["FI","Finlândia"],["FR","França"],["GA","Gabão"],["GH","Gana"],["GE","Geórgia"],["GI","Gibraltar"],["GD","Granada"],["GL","Gronelândia"],["GR","Grécia"],["GP","Guadalupe"],["GU","Guame"],["GT","Guatemala"],["GG","Guernesey"],["GY","Guiana"],["GF","Guiana Francesa"],["GN","Guiné"],["GQ","Guiné Equatorial"],["GW","Guiné-Bissau"],["GM","Gâmbia"],["HT","Haiti"],["HN","Honduras"],["HK","Hong Kong, RAE da China"],["HU","Hungria"],["BV","Ilha Bouvet"],["NF","Ilha Norfolk"],["IM","Ilha de Man"],["CX","Ilha do Natal"],["KY","Ilhas Caimão"],["CK","Ilhas Cook"],["FK","Ilhas Falkland"],["FO","Ilhas Faroé"],["GS","Ilhas Geórgia do Sul e Sandwich do Sul"],["HM","Ilhas Heard e McDonald"],["MP","Ilhas Marianas do Norte"],["MH","Ilhas Marshall"],["UM","Ilhas Menores Afastadas dos EUA"],["PN","Ilhas Pitcairn"],["SB","Ilhas Salomão"],["TC","Ilhas Turcas e Caicos"],["VG","Ilhas Virgens Britânicas"],["VI","Ilhas Virgens dos EUA"],["CC","Ilhas dos Cocos (Keeling)"],["ID","Indonésia"],["IQ","Iraque"],["IE","Irlanda"],["IR","Irão"],["IS","Islândia"],["IL","Israel"],["IT","Itália"],["YE","Iémen"],["JM","Jamaica"],["JP","Japão"],["JE","Jersey"],["DJ","Jibuti"],["JO","Jordânia"],["KW","Koweit"],["LA","Laos"],["LS","Lesoto"],["LV","Letónia"],["LR","Libéria"],["LI","Listenstaine"],["LT","Lituânia"],["LU","Luxemburgo"],["LB","Líbano"],["LY","Líbia"],["MO","Macau, RAE da China"],["MK","Macedónia do Norte"],["MG","Madagáscar"],["YT","Maiote"],["MV","Maldivas"],["ML","Mali"],["MT","Malta"],["MY","Malásia"],["MW","Maláui"],["MA","Marrocos"],["MQ","Martinica"],["MR","Mauritânia"],["MU","Maurícia"],["MM","Mianmar (Birmânia)"],["FM","Micronésia"],["MD","Moldávia"],["MN","Mongólia"],["MS","Monserrate"],["ME","Montenegro"],["MZ","Moçambique"],["MX","México"],["MC","Mónaco"],["NA","Namíbia"],["NR","Nauru"],["NP","Nepal"],["NI","Nicarágua"],["NG","Nigéria"],["NU","Niuê"],["NO","Noruega"],["NC","Nova Caledónia"],["NZ","Nova Zelândia"],["NE","Níger"],["OM","Omã"],["PW","Palau"],["PA","Panamá"],["PG","Papua-Nova Guiné"],["PK","Paquistão"],["PY","Paraguai"],["NL","Países Baixos"],["BQ","Países Baixos Caribenhos"],["PE","Peru"],["PF","Polinésia Francesa"],["PL","Polónia"],["PR","Porto Rico"],["PT","Portugal"],["KG","Quirguistão"],["KI","Quiribáti"],["KE","Quénia"],["GB","Reino Unido"],["CF","República Centro-Africana"],["DO","República Dominicana"],["RE","Reunião"],["RO","Roménia"],["RW","Ruanda"],["RU","Rússia"],["SV","Salvador"],["WS","Samoa"],["AS","Samoa Americana"],["SH","Santa Helena"],["LC","Santa Lúcia"],["EH","Sara Ocidental"],["SC","Seicheles"],["SN","Senegal"],["SL","Serra Leoa"],["SG","Singapura"],["SO","Somália"],["LK","Sri Lanca"],["SD","Sudão"],["SS","Sudão do Sul"],["SR","Suriname"],["SE","Suécia"],["CH","Suíça"],["SJ","Svalbard e Jan Mayen"],["BL","São Bartolomeu"],["KN","São Cristóvão e Neves"],["SM","São Marinho"],["MF","São Martinho (Saint-Martin)"],["SX","São Martinho (Sint Maarten)"],["PM","São Pedro e Miquelão"],["ST","São Tomé e Príncipe"],["VC","São Vicente e Granadinas"],["RS","Sérvia"],["SY","Síria"],["TH","Tailândia"],["TW","Taiwan"],["TJ","Tajiquistão"],["TZ","Tanzânia"],["IO","Território Britânico do Oceano Índico"],["TF","Territórios Austrais Franceses"],["PS","Territórios palestinianos"],["TL","Timor-Leste"],["TG","Togo"],["TO","Tonga"],["TK","Toquelau"],["TT","Trindade e Tobago"],["TN","Tunísia"],["TM","Turquemenistão"],["TR","Turquia"],["TV","Tuvalu"],["UA","Ucrânia"],["UG","Uganda"],["UY","Uruguai"],["UZ","Usbequistão"],["VU","Vanuatu"],["VE","Venezuela"],["VN","Vietname"],["WF","Wallis e Futuna"],["ZW","Zimbabué"],["ZM","Zâmbia"],["ZA","África do Sul"],["AT","Áustria"],["IN","Índia"]];
window.CONSULDOCE_COUNTRIES=ADDRESS_COUNTRIES;
let countryListSeq=0;
function countryNamesForForm(){
  const names=state.countryNames?.length?state.countryNames:ADDRESS_COUNTRIES.map(([,name])=>name);
  return [...new Set(names.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'));
}
function countryOptions(selected='Portugal'){
  const names=countryNamesForForm();
  return `<select class="field country-input" name="country" autocomplete="country-name" required>${names.map(name=>`<option value="${esc(name)}" ${name===String(selected||'Portugal')?'selected':''}>${esc(name)}</option>`).join('')}</select>`;
}
async function loadCountryNames(){
  if(state.countryNames?.length)return state.countryNames;
  try{
    const {data,error}=await sb.from('countries').select('name').order('name',{ascending:true});
    if(error)throw error;
    state.countryNames=[...new Set((data||[]).map(r=>String(r.name||'').trim()).filter(Boolean))];
  }catch(e){state.countryNames=[];}
  return state.countryNames;
}
function phoneCountryOptions(selected='+351'){return PHONE_COUNTRIES.map(([code,fl,name,prefix])=>`<option value="${prefix}" title="${esc(name)}" ${prefix===selected?'selected':''}>${fl} (${prefix})</option>`).join('')}
function profileAddress(p){return [p?.address_line1,p?.address_line2,p?.postal_code,p?.postal_locality,p?.country].map(v=>String(v||'').trim()).filter(Boolean).join(', ') || p?.address || '—'}


function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(n){return Number(n||0).toLocaleString('pt-PT',{minimumFractionDigits:0,maximumFractionDigits:0})+' un.';}
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>toastEl.classList.remove('show'),3200)}
function showProgress(title='A atualizar dados…',percent=0,detail=''){let el=document.getElementById('operationProgress');if(!el){document.body.insertAdjacentHTML('beforeend',`<div id="operationProgress" class="operation-progress" role="status" aria-live="polite"><div class="operation-progress-card"><div class="operation-progress-head"><strong id="operationProgressTitle"></strong><strong id="operationProgressPercent">0%</strong></div><div class="operation-progress-track"><div id="operationProgressBar" class="operation-progress-bar"></div></div><div id="operationProgressDetail" class="operation-progress-detail"></div></div></div>`);el=document.getElementById('operationProgress')}const pct=Math.max(0,Math.min(100,Math.round(percent)));document.getElementById('operationProgressTitle').textContent=title;document.getElementById('operationProgressPercent').textContent=`${pct}%`;document.getElementById('operationProgressBar').style.width=`${pct}%`;document.getElementById('operationProgressDetail').textContent=detail;el.classList.add('show')}
function hideProgress(){document.getElementById('operationProgress')?.classList.remove('show')}
function progressFor(index,total){return total?Math.min(100,Math.round((index/total)*100)):0}
function loadCart(){try{const raw=JSON.parse(localStorage.getItem('consuldoce_cart')||'{}');const out={};for(const [id,v] of Object.entries(raw||{})){const q=Math.min(99,Math.max(0,parseInt(v)||0));if(q)out[id]=q}return out}catch{return {}}}
function saveCart(){localStorage.setItem('consuldoce_cart',JSON.stringify(state.cart))}
function cartCount(){return Object.values(state.cart).reduce((a,b)=>a+Number(b),0)}
function setRoute(r){location.hash=r;state.route=r;document.getElementById('cartMount')?.replaceChildren();render()}
function logo(){return `<div class="brand"><div class="brand-mark">C</div><div><div class="brand-name">CONSULDOCE</div><div class="brand-sub">Gestão empresarial inteligente</div></div></div>`}
function authLanguageButton(){return `<div class="auth-language"><button class="btn btn-light btn-small" data-action="toggle-language" data-language-button="1" title="${state.language==='zh-CN'?'切换到葡萄牙语':'Traduzir para mandarim'}">${state.language==='zh-CN'?'PT':'中文'}</button></div>`}
function header(){return `<header class="topbar"><div class="topbar-inner">${logo()}<div class="spacer"></div>${state.profile?`<div class="top-actions"><span class="desktop-only" style="font-size:11px;opacity:.8">${esc(state.profile.email||'')}</span>${state.profile.role==='admin'?`<button class="btn btn-secondary" data-action="route" data-route="#/admin">Administração</button>`:''}<button class="btn btn-secondary" data-action="route" data-route="#/catalog">Catálogo</button><button class="btn btn-secondary account-button" data-action="route" data-route="#/account">Minha conta</button><button class="btn btn-primary" data-action="open-cart">Carrinho (${cartCount()})</button><button class="btn btn-secondary" data-action="toggle-language" data-language-button="1" title="${state.language==='zh-CN'?'切换到葡萄牙语':'Traduzir todo o site para mandarim'}">${state.language==='zh-CN'?'PT':'中文'}</button><button class="btn btn-secondary" data-action="logout">Sair</button></div>`:''}</div></header>`}

function L(pt, zh){return state.language==='zh-CN'?zh:pt}
function auth(){
  const forgot=state.authMode==='forgot';
  const recovery=state.authMode==='recovery';
  const langButton=authLanguageButton();
  if(state.authMode==='registered') return `<div class="auth-shell"><div class="auth-card"><div class="auth-logo">${logo()}</div>${langButton}<div class="eyebrow">${L('Registo concluído','注册完成')}</div><h1 class="h1">${L('Conta registada com sucesso','账户注册成功')}</h1><p class="lead" style="margin-bottom:18px">${L('A sua conta foi criada. Para concluir o registo, consulte o email enviado para o endereço indicado e clique no link de confirmação.','您的账户已创建。请查看发送到您所填写邮箱的邮件，并点击确认链接以完成注册。')}</p><div class="notice success"><strong>${L('Confirme o seu email','请确认您的邮箱')}</strong><br>${L('Depois da confirmação poderá voltar a esta página e iniciar sessão.','确认后，您可以返回此页面登录。')}</div><button class="btn btn-primary" style="width:100%;margin-top:18px" data-action="registered-back-login">${L('Voltar ao login','返回登录')}</button><p class="footer-note">${L('Se não encontrar o email, verifique também a pasta de spam.','如果找不到邮件，请同时检查垃圾邮件文件夹。')}</p></div></div>`;
  if(forgot) return `<div class="auth-shell"><div class="auth-card"><div class="auth-logo">${logo()}</div>${langButton}<div class="eyebrow">${L('Recuperação de acesso','账户恢复')}</div><h1 class="h1">${L('Esqueci-me da palavra-passe','忘记密码')}</h1><p class="lead" style="margin-bottom:20px">${L('Indique o email da conta e enviaremos instruções para definir uma nova palavra-passe.','请输入账户邮箱，我们会发送设置新密码的说明。')}</p><form id="authForm" class="stack"><div class="form-group"><label class="label">${L('Email','电子邮箱')}</label><input class="field" name="email" type="email" required autocomplete="email"></div><button class="btn btn-primary" type="submit">${L('Enviar instruções','发送说明')}</button></form><div id="authMsg" style="margin-top:12px"></div><p class="footer-note"><button class="link-button" data-action="auth-login">${L('Voltar ao login','返回登录')}</button></p></div></div>`;
  if(recovery) return `<div class="auth-shell"><div class="auth-card"><div class="auth-logo">${logo()}</div>${langButton}<div class="eyebrow">${L('Recuperação de acesso','账户恢复')}</div><h1 class="h1">${L('Definir nova palavra-passe','设置新密码')}</h1><p class="lead" style="margin-bottom:20px">${L('Escolha uma nova palavra-passe com pelo menos 8 caracteres.','请输入至少 8 个字符的新密码。')}</p><form id="authForm" class="stack"><div class="form-group"><label class="label">${L('Nova palavra-passe','新密码')}</label><input class="field" name="password" type="password" required minlength="8" autocomplete="new-password"></div><div class="form-group"><label class="label">${L('Confirmar palavra-passe','确认密码')}</label><input class="field" name="password_confirm" type="password" required minlength="8" autocomplete="new-password"></div><button class="btn btn-primary" type="submit">${L('Guardar nova palavra-passe','保存新密码')}</button></form><div id="authMsg" style="margin-top:12px"></div><p class="footer-note"><button class="link-button" data-action="auth-login">${L('Voltar ao login','返回登录')}</button></p></div></div>`;
  const isLogin=state.authMode==='login';
  return `<div class="auth-shell"><div class="auth-card"><div class="auth-logo">${logo()}</div>${langButton}<div class="eyebrow">${L('Acesso seguro','安全登录')}</div><h1 class="h1">${isLogin?L('Entrar no catálogo','登录目录'):L('Criar acesso de cliente','创建客户账户')}</h1><p class="lead" style="margin-bottom:20px">${isLogin?L('Encomende a mercadoria disponível sem visualizar preços.','订购现有商品，无需查看价格。'):L('Registe os dados da sua empresa para começar.','填写您的企业资料即可开始。')}</p><div class="tabs"><button class="tab ${isLogin?'active':''}" data-action="auth-login-render">${L('Entrar','登录')}</button><button class="tab ${state.authMode==='signup'?'active':''}" data-action="auth-signup-render">${L('Registar','注册')}</button></div><form id="authForm" class="stack">${state.authMode==='signup'?`<div class="form-grid"><div class="form-group full"><label class="label">${L('Nome / empresa','姓名 / 公司')}</label><input class="field" name="full_name" required maxlength="150" autocomplete="organization"></div><div class="form-group"><label class="label">${L('NIF','税号')}</label><input class="field" name="nif" required maxlength="20" autocomplete="off"></div><div class="form-group full"><label class="label">${L('Telemóvel','手机')}</label><div class="phone-field"><select class="field phone-prefix" name="phone_country_code" aria-label="${L('País e indicativo','国家及区号')}">${phoneCountryOptions('+351')}</select><input class="field phone-number" name="phone_number" type="tel" required inputmode="tel" autocomplete="tel" maxlength="30" placeholder="912 345 678"></div></div><div class="form-group full"><label class="label">${L('Endereço principal','主要地址')}</label><input class="field" name="address_line1" required maxlength="250" autocomplete="street-address"></div><div class="form-group full"><label class="label">${L('Andar, lote, fração, porta, etc.','楼层、地块、单元、门牌等')} <span class="hint">${L('(opcional)','（可选）')}</span></label><input class="field" name="address_line2" maxlength="150" autocomplete="address-line2"></div><div class="form-group"><label class="label">${L('Código postal','邮政编码')}</label><input class="field" name="postal_code" required maxlength="20" autocomplete="postal-code"></div><div class="form-group"><label class="label">${L('Localidade postal','邮政地区')}</label><input class="field" name="postal_locality" required maxlength="120" autocomplete="address-level2"></div><div class="form-group full"><label class="label">${L('País','国家')}</label>${countryOptions('Portugal')}</div></div>`:''}<div class="form-group"><label class="label">${L('Email','电子邮箱')}</label><input class="field" name="email" type="email" required autocomplete="email"></div><div class="form-group"><label class="label">${L('Palavra-passe','密码')}</label><input class="field" name="password" type="password" required minlength="8" autocomplete="${isLogin?'current-password':'new-password'}"></div><button class="btn btn-primary" type="submit">${isLogin?L('Entrar','登录'):L('Criar conta','创建账户')}</button></form>${isLogin?`<button class="link-button" style="margin-top:14px" data-action="forgot-password">${L('Esqueci-me da palavra-passe','忘记密码')}</button>`:''}<div id="authMsg" style="margin-top:12px"></div><p class="footer-note">${L('Catálogo privado B2B · Consuldoce','B2B 私人目录 · Consuldoce')}</p></div></div>`;
}

async function setLanguage(lang){
  state.language=lang==='zh-CN'?'zh-CN':'pt';
  localStorage.setItem('consuldoce_language',state.language);
  document.documentElement.lang=state.language==='zh-CN'?'zh-CN':'pt-PT';

  // O idioma é uma preferência local. Primeiro reconstruímos o ecrã com o
  // idioma escolhido e só depois executamos a tradução dos textos dinâmicos.
  // Assim evitamos que o tradutor observe/renderize a página antiga durante a
  // troca de idioma, problema que afetava as páginas autenticadas.
  if(!state.session){
    app.innerHTML=auth();
    document.getElementById('authForm')?.addEventListener('submit',doAuth);
  }else{
    try { await render(); } catch(e) { console.error(e); }
  }

  // Atualiza o botão e todos os textos depois de o DOM final existir.
  document.querySelectorAll('[data-language-button]').forEach(btn=>{
    btn.textContent=state.language==='zh-CN'?'PT':'中文';
    btn.title=state.language==='zh-CN'?'切换到葡萄牙语':'Traduzir para mandarim';
  });
  window.CONSULDOCE_I18N?.translatePage();
  window.dispatchEvent(new CustomEvent('consuldoce-language-change',{detail:{language:state.language}}));
  requestAnimationFrame(()=>window.CONSULDOCE_I18N?.translatePage());
}
function toggleLanguage(){return setLanguage(state.language==='zh-CN'?'pt':'zh-CN')}

function normalizeNif(v){return String(v??'').replace(/[^0-9]/g,'')}
function normalizeTaxId(v){return String(v??'').toUpperCase().replace(/[^0-9A-Z]/g,'')}
// --- Validação de NIF / número de identificação fiscal por país -----------------------------
// Algoritmos oficiais de dígito de controlo onde documentados publicamente; para os restantes
// países é aplicada uma validação de formato (comprimento e caracteres alfanuméricos), já que
// não existe uma regra de dígito de controlo unificada e publicamente verificável.
function isValidMod11Nif9(value){const nif=normalizeNif(value);if(nif.length!==9)return false;if(!/^[1-9]\d{8}$/.test(nif))return false;if(/^([0-9])\1{8}$/.test(nif))return false;const weights=[9,8,7,6,5,4,3,2];let sum=0;for(let i=0;i<8;i++)sum+=Number(nif.charAt(i))*weights[i];const remainder=sum%11;const check=remainder<2?0:11-remainder;return check===Number(nif.charAt(8))}
function isValidPortugueseNif(value){return isValidMod11Nif9(value)}
function isValidSpanishNif(value){const v=normalizeTaxId(value);const NIF_LETTERS='TRWAGMYFPDXBNJZSQVHLCKE';if(/^\d{8}[A-Z]$/.test(v))return v[8]===NIF_LETTERS[Number(v.slice(0,8))%23];if(/^[XYZ]\d{7}[A-Z]$/.test(v)){const map={X:'0',Y:'1',Z:'2'};const num=Number(map[v[0]]+v.slice(1,8));return v[8]===NIF_LETTERS[num%23]}if(/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(v)){const letter=v[0],digits=v.slice(1,8),control=v[8];let sumOdd=0,sumEven=0;for(let i=0;i<digits.length;i++){const d=Number(digits[i]);if(i%2===0){let n=d*2;if(n>9)n-=9;sumOdd+=n}else{sumEven+=d}}const total=sumOdd+sumEven;const unit=total%10;const controlDigit=unit===0?0:10-unit;const controlLetter='JABCDEFGHI'[controlDigit];if(/^[NPQRSW]$/.test(letter))return control===controlLetter;if(/^[ABEH]$/.test(letter))return control===String(controlDigit);return control===String(controlDigit)||control===controlLetter}return false}
function isValidFrenchNif(value){const v=normalizeTaxId(value);const m=/^([0-9A-Z]{2})(\d{9})$/.exec(v);if(!m)return false;const key=m[1],siren=m[2];if(/^\d{2}$/.test(key))return Number(key)===(12+3*(Number(siren)%97))%97;return true}
function isValidItalianPartitaIva(value){const v=normalizeNif(value);if(v.length!==11)return false;let sum=0;for(let i=0;i<10;i++){let d=Number(v[i]);if(i%2===1){d*=2;if(d>9)d-=9}sum+=d}return(10-(sum%10))%10===Number(v[10])}
function isValidGermanVat(value){const v=normalizeNif(value);if(v.length!==9)return false;let product=10;for(let i=0;i<8;i++){let sum=(Number(v[i])+product)%10;if(sum===0)sum=10;product=(2*sum)%11}const checkDigit=(11-product)%10;return checkDigit===Number(v[8])}
function isValidUkVat(value){const raw=String(value||'').trim().toUpperCase();if(/^(GD|HA)\d{3}$/.test(raw))return true;const v=normalizeNif(value);const check9=(digits)=>{const weights=[8,7,6,5,4,3,2];let sum=0;for(let i=0;i<7;i++)sum+=Number(digits[i])*weights[i];const check=Number(digits.slice(7,9));let total=sum+check;if(total%97===0)return true;total=sum+check-55;return total%97===0};if(v.length===9)return check9(v);if(v.length===12)return check9(v.slice(0,9));return false}
function isValidDutchVat(value){const v=normalizeTaxId(value);const m=/^(\d{9})B\d{2}$/.exec(v);const digits=m?m[1]:(/^\d{9}$/.test(v)?v:null);if(!digits)return false;const weights=[9,8,7,6,5,4,3,2];let sum=0;for(let i=0;i<8;i++)sum+=Number(digits[i])*weights[i];return sum%11===Number(digits[8])}
function isValidBelgianVat(value){let v=normalizeNif(value);if(v.length===9)v='0'+v;if(v.length!==10)return false;if(!/^[01]/.test(v))return false;const base=Number(v.slice(0,8)),check=Number(v.slice(8,10));return(97-(base%97))===check}
function isValidCpf(v){if(v.length!==11||/^(\d)\1{10}$/.test(v))return false;let sum=0;for(let i=0;i<9;i++)sum+=Number(v[i])*(10-i);let d1=(sum*10)%11;if(d1===10)d1=0;if(d1!==Number(v[9]))return false;sum=0;for(let i=0;i<10;i++)sum+=Number(v[i])*(11-i);let d2=(sum*10)%11;if(d2===10)d2=0;return d2===Number(v[10])}
function isValidCnpj(v){if(v.length!==14||/^(\d)\1{13}$/.test(v))return false;const calc=(base)=>{const weights=base.length===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2];let sum=0;for(let i=0;i<base.length;i++)sum+=Number(base[i])*weights[i];const r=sum%11;return r<2?0:11-r};if(calc(v.slice(0,12))!==Number(v[12]))return false;return calc(v.slice(0,13))===Number(v[13])}
function isValidBrazilianNif(value){const v=normalizeNif(value);if(v.length===11)return isValidCpf(v);if(v.length===14)return isValidCnpj(v);return false}
function isValidGenericTaxId(value){const v=normalizeTaxId(value);return v.length>=5&&v.length<=20&&/[0-9]/.test(v)}
function countryCodeFromName(name){const found=ADDRESS_COUNTRIES.find(([,n])=>n===String(name||'').trim());return found?found[0]:null}
const NIF_VALIDATORS={PT:{fn:isValidMod11Nif9,label:'português'},CV:{fn:isValidMod11Nif9,label:'cabo-verdiano'},ES:{fn:isValidSpanishNif,label:'espanhol'},FR:{fn:isValidFrenchNif,label:'francês'},IT:{fn:isValidItalianPartitaIva,label:'italiano'},DE:{fn:isValidGermanVat,label:'alemão'},GB:{fn:isValidUkVat,label:'britânico'},NL:{fn:isValidDutchVat,label:'neerlandês'},BE:{fn:isValidBelgianVat,label:'belga'},BR:{fn:isValidBrazilianNif,label:'brasileiro (CPF/CNPJ)'}};
function validateNifForCountry(value,countryName){const nif=String(value||'').trim();if(!nif)return{valid:false,message:'O NIF é obrigatório.'};const code=countryCodeFromName(countryName);const rule=code?NIF_VALIDATORS[code]:null;if(rule){if(!rule.fn(nif))return{valid:false,message:`NIF ${rule.label} inválido. Verifique o número introduzido.`};return{valid:true,normalized:normalizeTaxId(nif)}}if(!isValidGenericTaxId(nif))return{valid:false,message:'NIF inválido. Introduza um número de identificação fiscal válido para o país selecionado.'};return{valid:true,normalized:normalizeTaxId(nif)}}
function showForgotPassword(){state.authMode='forgot';render()}
async function requestPasswordReset(e){e.preventDefault();const f=new FormData(e.target);const email=String(f.get('email')||'').trim().toLowerCase();const msg=document.getElementById('authMsg');msg.innerHTML='';try{const redirectTo=`${location.origin}/recovery`;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;msg.innerHTML='<div class="notice success">Se o email estiver registado, receberá instruções para recuperar o acesso. Verifique também a pasta de spam.</div>'}catch(err){msg.innerHTML=`<div class="notice danger">${esc(err.message||'Não foi possível enviar o email de recuperação.')}</div>`}}
async function updatePassword(e){e.preventDefault();const f=new FormData(e.target);const password=String(f.get('password')||''),confirm=String(f.get('password_confirm')||'');const msg=document.getElementById('authMsg');msg.innerHTML='';if(password.length<8){msg.innerHTML='<div class="notice danger">A palavra-passe deve ter pelo menos 8 caracteres.</div>';return}if(password!==confirm){msg.innerHTML='<div class="notice danger">As palavras-passe não coincidem.</div>';return}try{const {error}=await sb.auth.updateUser({password});if(error)throw error;state.recoveryFlow=false;state.authMode='login';await sb.auth.signOut();state.session=null;state.profile=null;state.route='#/login';location.hash='#/login';render();toast('Palavra-passe alterada. Já pode entrar com a nova palavra-passe.')}catch(err){msg.innerHTML=`<div class="notice danger">${esc(err.message||'Não foi possível alterar a palavra-passe.')}</div>`}}
let authSubmitInFlight=false;
async function doAuth(e){
  e.preventDefault();
  if(!sb)return;
  if(authSubmitInFlight)return;

  const mode=state.authMode;
  const submitter=e.submitter||e.target.querySelector('button[type="submit"]');
  const originalText=submitter?.textContent||'';
  const lock=mode==='signup';

  if(lock){
    authSubmitInFlight=true;
    if(submitter){
      submitter.disabled=true;
      submitter.setAttribute('aria-busy','true');
      submitter.textContent='A criar conta...';
    }
  }

  const f=new FormData(e.target);
  const email=String(f.get('email')||'').trim().toLowerCase(),password=f.get('password');
  const msg=document.getElementById('authMsg');
  msg.innerHTML='';

  try{
    if(mode==='forgot'){return await requestPasswordReset(e)}
    if(mode==='recovery'){return await updatePassword(e)}
    if(mode==='login'){
      const {data:loginData,error}=await sb.auth.signInWithPassword({email,password});
      if(error)throw error;
      state.session=loginData.session;
      await loadProfile();
      if(state.profile?.must_change_password){ state.route='#/force-password'; render(); return; }
      toast('Sessão iniciada.');
    }else{
      const country=String(f.get('country')||'Portugal').trim();
      const nifCheck=validateNifForCountry(f.get('nif'),country);
      if(!nifCheck.valid){
        msg.innerHTML=`<div class="notice danger">${esc(nifCheck.message)}</div>`;
        return;
      }
      const nif=nifCheck.normalized;

      const emailRedirectTo=`${location.origin}${location.pathname}`;
      const {data,error}=await sb.auth.signUp({
        email,
        password,
        options:{
          emailRedirectTo,
          data:{full_name:f.get('full_name'),nif,phone_country_code:f.get('phone_country_code'),phone_number:f.get('phone_number'),address_line1:f.get('address_line1'),address_line2:f.get('address_line2'),postal_code:f.get('postal_code'),postal_locality:f.get('postal_locality'),country:f.get('country')}
        }
      });

      if(error){
        const m=String(error.message||'');
        if(/duplicate|unique|already registered|already exists|profiles_nif|profiles_email|email.*exist|nif.*exist/i.test(m) || error.code==='23505')
          throw new Error(/nif/i.test(m) ? 'Já existe um cliente registado com este NIF.' : 'Já existe uma conta registada com este email.');
        throw error;
      }

      // Supabase may intentionally avoid revealing whether an email exists.
      // When that protection returns an empty identities array, do not proceed
      // as if a new account had been created.
      if(data?.user && Array.isArray(data.user.identities) && data.user.identities.length===0){
        throw new Error('Já existe uma conta registada com este email.');
      }

      if(!data.session){
        state.authMode='registered';
        history.pushState({registered:true},'',location.href);
        render();
      }else{
        state.session=data.session;
        await loadProfile();
        if(state.profile?.must_change_password){state.route='#/force-password';render();return;}
        toast('Conta criada.');
      }
    }
  }catch(err){
    msg.innerHTML=`<div class="notice danger">${esc(err.message||'Não foi possível concluir.')}</div>`;
  }finally{
    if(lock){
      authSubmitInFlight=false;
      if(submitter){
        submitter.disabled=false;
        submitter.removeAttribute('aria-busy');
        submitter.textContent=originalText;
      }
    }
  }
}
async function logout(){await sb?.auth.signOut();state.session=null;state.profile=null;setRoute('#/login')}

function isRecoveryLocation(){const path=String(location.pathname||'').replace(/\/+$/,'')||'/';const query=new URLSearchParams(location.search);const hash=location.hash.startsWith('#')?location.hash.slice(1):location.hash;const hashParams=new URLSearchParams(hash);return path==='/recovery'||query.get('recovery')==='1'||query.get('type')==='recovery'||hashParams.get('type')==='recovery'||location.hash.includes('access_token=')||location.hash.includes('refresh_token=')}
async function loadSession(){if(!sb){state.route='#/login';return}if(isRecoveryLocation())state.recoveryFlow=true;if(state.recoveryFlow)state.authMode='recovery';const applySession=async(event,s)=>{state.language=localStorage.getItem('consuldoce_language')==='zh-CN'?'zh-CN':'pt';document.documentElement.lang=state.language==='zh-CN'?'zh-CN':'pt-PT';const recovery=state.recoveryFlow||event==='PASSWORD_RECOVERY';if(recovery){state.authMode='recovery';state.session=s||state.session;state.profile=null;state.route='#/reset-password';render();return}state.session=s;if(s){await loadProfile();if(state.profile?.must_change_password){state.route='#/force-password'}else if(state.route==='#/login'||state.route==='#/reset-password')state.route='#/catalog'}else{state.profile=null;state.route='#/login'}render()};sb.auth.onAuthStateChange((event,s)=>{setTimeout(()=>applySession(event,s),0)});const {data}=await sb.auth.getSession();await applySession('INITIAL_SESSION',data.session)}
async function loadProfile(){const {data,error}=await sb.from('profiles').select('*').eq('id',state.session.user.id).single();if(!error){state.profile=data;const authEmail=String(state.session.user.email||'').trim().toLowerCase();if(authEmail&&authEmail!==String(data.email||'').trim().toLowerCase()){const {data:updated}=await sb.from('profiles').update({email:authEmail}).eq('id',state.session.user.id).select('*').single();if(updated)state.profile=updated}}else state.profile={id:state.session.user.id,email:state.session.user.email,role:'client'};await loadAddresses()}
async function loadAddresses(){if(!sb||!state.session){state.addresses=[];return}const {data,error}=await sb.from('customer_addresses').select('id,label,address_line1,address_line2,postal_code,postal_locality,country,is_default,created_at,updated_at').eq('client_id',state.session.user.id).order('is_default',{ascending:false}).order('created_at',{ascending:true});if(error){console.error('loadAddresses',error);state.addresses=[];return}state.addresses=data||[]}
function addressText(a){return [a?.address_line1,a?.address_line2,a?.postal_code,a?.postal_locality,a?.country].map(v=>String(v||'').trim()).filter(Boolean).join(', ')}
function addressLabel(a){return a?.label||'Morada'}

function forcePassword(){return `<div class="auth-shell"><div class="auth-card"><div class="auth-logo">${logo()}</div>${authLanguageButton()}<div class="eyebrow">Segurança da conta</div><h1 class="h1">Defina uma nova palavra-passe</h1><p class="lead" style="margin-bottom:20px">Por motivos de segurança, a administração pediu-lhe para alterar a palavra-passe antes de continuar.</p><form id="forcePasswordForm" class="stack"><div class="form-group"><label class="label">Nova palavra-passe</label><input class="field" name="password" type="password" required minlength="8" autocomplete="new-password"></div><div class="form-group"><label class="label">Confirmar nova palavra-passe</label><input class="field" name="password_confirm" type="password" required minlength="8" autocomplete="new-password"></div><button class="btn btn-primary" type="submit">Guardar nova palavra-passe</button></form><div id="forcePasswordMsg" style="margin-top:12px"></div></div></div>`}

async function changeForcedPassword(e){e.preventDefault();const form=e.target,msg=document.getElementById('forcePasswordMsg'),f=new FormData(form),password=String(f.get('password')||''),confirm=String(f.get('password_confirm')||'');msg.innerHTML='';if(password.length<8){msg.innerHTML='<div class="notice danger">A palavra-passe deve ter pelo menos 8 caracteres.</div>';return}if(password!==confirm){msg.innerHTML='<div class="notice danger">As palavras-passe não coincidem.</div>';return}try{const {error}=await sb.auth.updateUser({password});if(error)throw error;const {data,error:profileError}=await sb.from('profiles').update({must_change_password:false}).eq('id',state.session.user.id).select('*').single();if(profileError)throw profileError;state.profile=data;state.route='#/catalog';toast('Palavra-passe alterada com sucesso.');render()}catch(err){msg.innerHTML=`<div class="notice danger">${esc(err.message||'Não foi possível alterar a palavra-passe.')}</div>`}}

function account(){const p=state.profile||{};const addresses=state.addresses||[];return `${header()}<main class="page"><div class="hero"><div><div class="eyebrow">Área de cliente</div><h1 class="h1">Os meus dados</h1><p class="lead">Consulte e altere os dados associados à sua conta.</p></div></div><div class="account-grid"><section class="panel"><h2 class="panel-title">Dados da empresa e contacto</h2><p class="hint" style="margin-bottom:18px">Estas informações são usadas para identificação e contacto.</p><form id="accountProfileForm" class="form-grid"><div class="form-group full"><label class="label">Nome / empresa</label><input class="field" name="full_name" required maxlength="150" value="${esc(p.full_name||'')}" autocomplete="organization"></div><div class="form-group"><label class="label">NIF</label><input class="field" name="nif" required maxlength="20" value="${esc(p.nif||'')}" autocomplete="off"></div><div class="form-group full"><label class="label">País (para efeitos de validação do NIF)</label>${countryOptions(p.country||'Portugal')}</div><div class="form-group full"><label class="label">Telemóvel</label><div class="phone-field"><select class="field phone-prefix" name="phone_country_code" aria-label="País e indicativo">${phoneCountryOptions(p.phone_country_code||'+351')}</select><input class="field phone-number" name="phone_number" type="tel" required inputmode="tel" maxlength="30" value="${esc(p.phone_number||'')}" autocomplete="tel"></div></div><div class="form-group full"><label class="label">Email</label><input class="field" name="email" type="email" required maxlength="255" value="${esc(p.email||state.session?.user?.email||'')}" autocomplete="email"><span class="hint">Uma alteração do email pode exigir confirmação no novo endereço.</span></div><div class="form-group full"><button class="btn btn-primary" type="submit">Guardar alterações</button></div></form><div id="accountProfileMsg" style="margin-top:12px"></div></section><section class="panel"><div class="account-section-head"><div><h2 class="panel-title" style="margin-bottom:4px">As minhas moradas</h2><p class="hint">Pode ter várias moradas. Uma delas deve estar sempre definida como predefinida.</p></div><button class="btn btn-light btn-small" data-action="new-address">+ Nova morada</button></div><div id="addressList">${addresses.length?addresses.map(a=>`<div class="address-card ${a.is_default?'default':''}"><div><div class="address-title">${esc(addressLabel(a))} ${a.is_default?'<span class="status done">Predefinida</span>':''}</div><div class="hint">${esc(addressText(a))}</div></div><div class="address-actions">${a.is_default?'':`<button class="btn btn-light btn-small" data-action="set-default-address" data-id="${esc(a.id)}">Tornar predefinida</button>`}<button class="btn btn-light btn-small" data-action="edit-address" data-id="${esc(a.id)}">Editar</button>${addresses.length>1?`<button class="btn btn-light btn-small" data-action="delete-address" data-id="${esc(a.id)}">Eliminar</button>`:''}</div></div>`).join(''):'<div class="empty">Ainda não existem moradas guardadas.</div>'}</div></section><section class="panel"><h2 class="panel-title">Palavra-passe</h2><p class="hint" style="margin-bottom:18px">Altere aqui a palavra-passe enquanto está autenticado.</p><form id="accountPasswordForm" class="stack"><div class="form-group"><label class="label">Nova palavra-passe</label><input class="field" name="password" type="password" required minlength="8" autocomplete="new-password"></div><div class="form-group"><label class="label">Confirmar nova palavra-passe</label><input class="field" name="password_confirm" type="password" required minlength="8" autocomplete="new-password"></div><button class="btn btn-primary" type="submit">Alterar palavra-passe</button></form><div id="accountPasswordMsg" style="margin-top:12px"></div></section><section class="panel"><h2 class="panel-title">Eliminar a minha conta</h2><p class="hint">A eliminação da conta é permanente. As encomendas já efetuadas serão preservadas no histórico comercial, mas deixarão de estar associadas a uma conta ativa.</p><button class="btn btn-danger" style="margin-top:14px" data-action="delete-own-account">Eliminar a minha conta</button></section></div><div class="footer-note">Consuldoce · Área de cliente</div></main>`}
async function saveAccountProfile(e){e.preventDefault();const form=e.target,msg=document.getElementById('accountProfileMsg'),btn=form.querySelector('button[type="submit"]');if(!sb||!state.session)return;msg.innerHTML='';if(btn){btn.disabled=true;btn.textContent='A guardar…'}try{const f=new FormData(form);const email=String(f.get('email')||'').trim().toLowerCase();const country=String(f.get('country')||'Portugal').trim();const nifCheck=validateNifForCountry(f.get('nif'),country);if(!nifCheck.valid)throw new Error(nifCheck.message);const nif=nifCheck.normalized;const full_name=String(f.get('full_name')||'').trim();const phone_country_code=String(f.get('phone_country_code')||'+351').trim();const phone_number=String(f.get('phone_number')||'').trim();const currentEmail=String(state.profile?.email||state.session.user.email||'').trim().toLowerCase();if(email!==currentEmail){const {error}=await sb.auth.updateUser({email});if(error)throw error;}const {data,error}=await sb.from('profiles').update({email:email!==currentEmail?currentEmail:email,full_name,nif,phone_country_code,phone_number,country}).eq('id',state.session.user.id).select('*').single();if(error){if(/duplicate|unique|profiles_nif|profiles_email/i.test(String(error.message||'')))throw new Error('Já existe outro cliente com este NIF ou email.');throw error}state.profile=data;const emailChanged=email!==currentEmail;msg.innerHTML=`<div class="notice success">Dados atualizados com sucesso.${emailChanged?' Foi enviado um pedido de confirmação para o novo email; o email da conta só será alterado após essa confirmação.':''}</div>`;toast('Dados do cliente atualizados.');}catch(err){msg.innerHTML=`<div class="notice danger">${esc(err.message||'Não foi possível guardar as alterações.')}</div>`}finally{if(btn){btn.disabled=false;btn.textContent='Guardar alterações'}}}
async function changeAccountPassword(e){e.preventDefault();const form=e.target,msg=document.getElementById('accountPasswordMsg'),btn=form.querySelector('button[type="submit"]');msg.innerHTML='';const f=new FormData(form);const password=String(f.get('password')||''),confirm=String(f.get('password_confirm')||'');if(password.length<8){msg.innerHTML='<div class="notice danger">A palavra-passe deve ter pelo menos 8 caracteres.</div>';return}if(password!==confirm){msg.innerHTML='<div class="notice danger">As palavras-passe não coincidem.</div>';return}if(btn){btn.disabled=true;btn.textContent='A alterar…'}try{const {error}=await sb.auth.updateUser({password});if(error)throw error;const {data,error:profileError}=await sb.from('profiles').update({must_change_password:false}).eq('id',state.session.user.id).select('*').single();if(profileError)throw profileError;state.profile=data;form.reset();msg.innerHTML='<div class="notice success">Palavra-passe alterada com sucesso.</div>';toast('Palavra-passe alterada.')}catch(err){msg.innerHTML=`<div class="notice danger">${esc(err.message||'Não foi possível alterar a palavra-passe.')}</div>`}finally{if(btn){btn.disabled=false;btn.textContent='Alterar palavra-passe'}}}

async function deleteOwnAccount(){if(!confirm('Eliminar definitivamente a sua conta? Esta ação não pode ser anulada. As encomendas serão preservadas no histórico comercial.'))return;try{await invokeClientAdmin('delete_own_account',state.session.user.id);await sb.auth.signOut();state.session=null;state.profile=null;state.addresses=[];state.route='#/login';state.authMode='login';toast('A sua conta foi eliminada.');render()}catch(err){toast(err.message||'Não foi possível eliminar a conta.')}}

async function loadProducts(){if(!sb||!state.session)return;const {data,error}=await sb.rpc('get_catalog_products',{p_only_in_stock:false});if(error){toast('Não foi possível carregar o catálogo. '+error.message);return}state.products=data||[];state.categories=[...new Set(state.products.map(p=>p.category).filter(Boolean))]}
function addressFormHtml(a={}){return `<div id="addressModal" class="modal open"><div class="modal-card"><div class="modal-head"><div><div class="eyebrow">Área de cliente</div><h2 style="margin:4px 0">${a.id?'Editar morada':'Adicionar morada'}</h2></div><button class="btn btn-light" data-action="close-address">Fechar</button></div><div class="modal-body"><form id="addressForm" class="form-grid"><input type="hidden" name="id" value="${esc(a.id||'')}"><div class="form-group full"><label class="label">Nome da morada</label><input class="field" name="label" required maxlength="80" value="${esc(a.label||'') }" placeholder="Ex.: Sede, Armazém, Entrega 2"></div><div class="form-group full"><label class="label">Endereço principal</label><input class="field" name="address_line1" required maxlength="250" value="${esc(a.address_line1||'')}" autocomplete="street-address"></div><div class="form-group full"><label class="label">Andar, lote, fração, porta, etc. <span class="hint">(opcional)</span></label><input class="field" name="address_line2" maxlength="150" value="${esc(a.address_line2||'')}" autocomplete="address-line2"></div><div class="form-group"><label class="label">Código postal</label><input class="field" name="postal_code" required maxlength="20" value="${esc(a.postal_code||'')}" autocomplete="postal-code"></div><div class="form-group"><label class="label">Localidade postal</label><input class="field" name="postal_locality" required maxlength="120" value="${esc(a.postal_locality||'')}" autocomplete="address-level2"></div><div class="form-group full"><label class="label">País</label>${countryOptions(a.country||'Portugal')}</div><div class="form-group full"><label><input type="checkbox" name="is_default" ${a.is_default?'checked':''}> Definir como morada predefinida</label></div><div class="form-group full"><button class="btn btn-primary" type="submit">Guardar morada</button></div></form><div id="addressMsg" style="margin-top:12px"></div></div></div></div>`}
function openAddressEditor(id=''){const a=(state.addresses||[]).find(x=>x.id===id)||{};document.body.insertAdjacentHTML('beforeend',addressFormHtml(a));document.getElementById('addressForm')?.addEventListener('submit',saveAddress)}
async function saveAddress(e){e.preventDefault();const form=e.target,msg=document.getElementById('addressMsg'),btn=form.querySelector('button[type="submit"]');try{const f=new FormData(form);const id=String(f.get('id')||'');const payload={client_id:state.session.user.id,label:String(f.get('label')||'').trim(),address_line1:String(f.get('address_line1')||'').trim(),address_line2:String(f.get('address_line2')||'').trim(),postal_code:String(f.get('postal_code')||'').trim(),postal_locality:String(f.get('postal_locality')||'').trim(),country:String(f.get('country')||'Portugal').trim(),is_default:f.get('is_default')==='on'};if(btn){btn.disabled=true;btn.textContent='A guardar…'}let result;if(id)result=await sb.from('customer_addresses').update(payload).eq('id',id).eq('client_id',state.session.user.id).select('*').single();else result=await sb.from('customer_addresses').insert(payload).select('*').single();if(result.error)throw result.error;await loadAddresses();document.getElementById('addressModal')?.remove();render();toast('Morada guardada.')}catch(err){msg.innerHTML=`<div class="notice danger">${esc(err.message||'Não foi possível guardar a morada.')}</div>`}finally{if(btn){btn.disabled=false;btn.textContent='Guardar morada'}}}
async function setDefaultAddress(id){const {error}=await sb.rpc('set_default_customer_address',{p_address_id:id});if(error){toast(error.message);return}await loadAddresses();render();toast('Morada predefinida atualizada.')}
async function deleteAddress(id){const a=state.addresses.find(x=>x.id===id);if(!a)return;if(a.is_default){toast('Escolha primeiro outra morada como predefinida.');return}if(!confirm('Eliminar esta morada?'))return;const {error}=await sb.from('customer_addresses').delete().eq('id',id).eq('client_id',state.session.user.id);if(error){toast(error.message);return}await loadAddresses();render();toast('Morada eliminada.')}

function catalog(){const cats=state.categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');return `${header()}<main class="page"><div class="hero"><div><div class="eyebrow">Catálogo</div><h1 class="h1">Produtos para encomenda</h1><p class="lead">Escolha as quantidades e envie a sua encomenda à Consuldoce. Os preços não são apresentados.</p></div><button class="btn btn-light" data-action="open-orders">As minhas encomendas</button></div><div class="toolbar"><input id="search" class="field search" placeholder="Pesquisar por produto, referência ou código de barras..." data-action="filter-products"><select id="cat" class="field category" data-action="filter-products"><option value="">Todas as categorias</option>${cats}</select><label class="stock-filter"><input id="onlyInStock" type="checkbox" checked data-action="filter-products"> Apenas em stock</label><select id="sort" class="field sort" data-action="filter-products"><option value="name-asc">Nome A–Z</option><option value="name-desc">Nome Z–A</option><option value="category-asc">Categoria A–Z</option><option value="category-desc">Categoria Z–A</option><option value="sku-asc">ID do produto A–Z</option><option value="sku-desc">ID do produto Z–A</option></select></div><div id="catalogGrid" class="catalog-grid"></div><div class="footer-note">Consuldoce · Catálogo B2B privado</div></main><div id="ordersMount"></div>`}
function renderProducts(list=state.products){const grid=document.getElementById('catalogGrid');if(!grid)return;grid.innerHTML=list.length?list.map(productCard).join(''):'<div class="empty">Não foram encontrados produtos.</div>'}
function productInStock(p){return p.in_stock === true || p.in_stock === 'true' || p.in_stock === 1}
function compareText(a,b,dir=1){return String(a||'').localeCompare(String(b||''),'pt',{sensitivity:'base'})*dir}
function filterProducts(){const q=(document.getElementById('search')?.value||'').toLowerCase().trim(),c=document.getElementById('cat')?.value||'',only=!!document.getElementById('onlyInStock')?.checked,sort=document.getElementById('sort')?.value||'name-asc';let list=state.products.filter(p=>(!c||p.category===c)&&(!only||productInStock(p))&&(!q||[p.name,p.sku,p.barcode,p.short_description].filter(Boolean).join(' ').toLowerCase().includes(q)));const [field,d]=sort.split('-');const dir=d==='desc'?-1:1;list.sort((a,b)=>field==='sku'?compareText(a.sku,b.sku,dir):field==='category'?compareText(a.category,b.category,dir):compareText(a.name,b.name,dir));renderProducts(list)}
function productCard(p){const qty=Number(state.cart[p.id]||0),available=productInStock(p);return `<article class="card"><div class="product-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`:'<div class="placeholder">Imagem do produto<br>por adicionar</div>'}</div><div class="card-body"><span class="tag">${esc(p.category||'Produto')}</span><div class="product-name">${esc(p.name)}</div><div class="sku">ID: ${esc(p.sku||'—')}</div><div class="stock ${available?'':'off'}">${available?'Em stock':'Fora de stock'}</div><div class="qty-row"><div class="qty"><button ${available?'':'disabled'} data-action="qty-minus" data-id="${esc(p.id)}">−</button><input aria-label="Quantidade" value="${qty}" min="0" max="99" inputmode="numeric" ${available?'':'disabled'} data-action="set-qty" data-id="${esc(p.id)}"><button ${available&&qty<99?'':'disabled'} data-action="qty-plus" data-id="${esc(p.id)}">+</button></div><button class="btn btn-primary" ${available?'':'disabled'} data-action="qty-add" data-id="${esc(p.id)}" data-value="${Math.min(99,qty+1)}" ${qty>=99?'disabled':''}>Adicionar</button></div></div></article>`}
function setQty(id,v){const p=state.products.find(x=>x.id===id);if(!p||!productInStock(p))return;let q=Math.min(99,Math.max(0,parseInt(v)||0));if(q)state.cart[id]=q;else delete state.cart[id];saveCart();filterProducts();updateCartButtons()}
function changeQty(id,d){setQty(id,(state.cart[id]||0)+d)}
function updateCartButtons(){document.querySelectorAll('.mobile-cart .btn').forEach(b=>b.textContent=`🛒 ${cartCount()}`);document.querySelectorAll('.top-actions .btn-primary').forEach(b=>b.textContent=`Carrinho (${cartCount()})`)}
function cartHtml(){const items=Object.entries(state.cart).map(([id,q])=>{const p=state.products.find(x=>x.id===id);if(!p)return '';return `<div class="cart-item"><img class="cart-thumb" src="${esc(p.image_url||'')}"><div class="cart-meta"><div class="cart-name">${esc(p.name)}</div><div class="sku">Ref. ${esc(p.sku||'—')}</div><div class="cart-actions"><div class="qty"><button data-action="cart-qty-minus" data-id="${esc(p.id)}">−</button><input value="${Math.min(99,Number(q)||0)}" min="0" max="99" inputmode="numeric" data-action="cart-set-qty" data-id="${esc(p.id)}"><button ${Number(q)<99?'':'disabled'} data-action="cart-qty-plus" data-id="${esc(p.id)}">+</button></div><strong>${money(q)}</strong></div></div></div>`}).join('');return `<div class="drawer open" data-action="drawer-backdrop"><div class="drawer-panel"><div class="drawer-head"><div style="display:flex;justify-content:space-between;align-items:center"><div><div class="eyebrow">Encomenda</div><h2 style="margin:4px 0">Carrinho</h2></div><button class="btn btn-light" data-action="close-cart">Fechar</button></div></div><div class="drawer-list">${items||'<div class="empty">O carrinho está vazio.</div>'}</div><div class="drawer-foot"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><strong>Total de artigos</strong><strong>${cartCount()}</strong></div><button class="btn btn-primary" style="width:100%" ${cartCount()?'':'disabled'} data-action="open-checkout">Finalizar encomenda</button></div></div></div>`}
async function openCart(){const mount=document.getElementById('cartMount');if(!mount)return;if(!state.products.length && state.cart && Object.keys(state.cart).length){await loadProducts()}mount.innerHTML=cartHtml();window.CONSULDOCE_I18N?.translatePage()}
function closeCart(){document.getElementById('cartMount').innerHTML=''}
function openCheckout(){closeCart();if(!state.addresses?.length){toast('Adicione uma morada na área de cliente antes de finalizar a encomenda.');return}const def=state.addresses.find(a=>a.is_default)||state.addresses[0];document.body.insertAdjacentHTML('beforeend',`<div id="checkoutModal" class="modal open"><div class="modal-card"><div class="modal-head"><div><div class="eyebrow">Confirmar</div><h2 style="margin:4px 0">Finalizar encomenda</h2></div><button class="btn btn-light" data-action="close-checkout">Fechar</button></div><div class="modal-body"><div class="notice success" style="margin-bottom:16px"><strong>${esc(state.profile?.full_name||'Cliente')}</strong><br>NIF ${esc(state.profile?.nif||'—')} · ${esc(state.profile?.phone_country_code||'')} ${esc(state.profile?.phone_number||'')}</div><div class="form-group"><label class="label">Morada de entrega</label><select id="orderAddress" class="field">${state.addresses.map(a=>`<option value="${esc(a.id)}" ${a.id===def.id?'selected':''}>${esc(addressLabel(a))}${a.is_default?' — predefinida':''} · ${esc(addressText(a))}</option>`).join('')}</select><span class="hint">A encomenda será enviada para a morada selecionada. Por defeito está escolhida a sua morada predefinida.</span></div><div class="notice" style="margin-top:16px"><strong>Morada selecionada:</strong><br><span id="selectedOrderAddress">${esc(addressText(def))}</span></div><div class="form-group"><label class="label">Observações (opcional)</label><textarea id="orderNotes" class="field" rows="4" maxlength="1000" placeholder="Ex.: entrega, preferência de acondicionamento... "></textarea></div><button class="btn btn-primary" style="width:100%;margin-top:16px" data-action="submit-order">Enviar encomenda</button></div></div></div>`)}
function updateCheckoutAddress(){const id=document.getElementById('orderAddress')?.value;const a=state.addresses.find(x=>x.id===id);const el=document.getElementById('selectedOrderAddress');if(el)el.textContent=a?addressText(a):''}
function closeCheckout(){document.getElementById('checkoutModal')?.remove()}
async function submitOrder(){if(!sb||!cartCount())return;const items=Object.entries(state.cart).map(([product_id,quantity])=>({product_id,quantity:Number(quantity)}));const notes=document.getElementById('orderNotes')?.value||'';const address_id=document.getElementById('orderAddress')?.value;if(!address_id){toast('Selecione uma morada de entrega.');return}try{const {data,error}=await sb.rpc('create_order',{p_items:items,p_notes:notes,p_address_id:address_id});if(error)throw error;const orderId=data;let emailOk=true;try{const r=await sb.functions.invoke('send-order-email',{body:{order_id:orderId}});if(r.error)emailOk=false}catch{emailOk=false}state.cart={};saveCart();closeCheckout();toast(emailOk?'Encomenda enviada com sucesso.':'Encomenda registada; o email será processado pela administração.');}catch(err){toast(err.message||'Não foi possível criar a encomenda.')}}
function orderStatusLabel(status){
  const isZh=location.hash.split('?')[0]!=='#/admin' && localStorage.getItem('consuldoce_language')==='zh-CN';
  const labels=isZh?{new:'新订单',processing:'处理中',completed:'已完成',cancelled:'已取消'}:{new:'Novo',processing:'Em preparação',completed:'Concluída',cancelled:'Cancelada'};
  return labels[status]||status;
}
async function openOrders(){const {data,error}=await sb.from('orders').select('id,status,notes,created_at,order_items(product_name,sku,quantity)').eq('client_id',state.session.user.id).order('created_at',{ascending:false});if(error){toast(error.message);return}document.body.insertAdjacentHTML('beforeend',`<div id="ordersModal" class="modal open"><div class="modal-card"><div class="modal-head"><div><div class="eyebrow">Histórico</div><h2 style="margin:4px 0">As minhas encomendas</h2></div><button class="btn btn-light" data-action="close-orders">Fechar</button></div><div class="modal-body">${data?.length?data.map(o=>`<div class="panel" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><strong>#${esc(o.id.slice(0,8))}</strong><span class="status ${o.status==='completed'?'done':o.status==='cancelled'?'cancelled':''}">${esc(orderStatusLabel(o.status))}</span></div><div class="hint" style="margin:5px 0 10px">${new Date(o.created_at).toLocaleString('pt-PT')}</div>${(o.order_items||[]).map(i=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0"><span>${esc(i.product_name)} <span class="hint">(${esc(i.sku||'')})</span></span><strong>${i.quantity}</strong></div>`).join('')}</div>`).join(''):'<div class="empty">Ainda não existem encomendas.</div>'}</div></div></div>`)}

function admin(){return `${header()}<main class="page"><div class="hero"><div><div class="eyebrow">Backoffice</div><h1 class="h1">Administração</h1><p class="lead">Gerir catálogo, imagens, stock e encomendas.</p></div></div><div class="admin-layout"><aside class="side"><button class="${state.adminTab==='orders'?'active':''}" data-action="admin-tab" data-tab="orders">Encomendas</button><button class="${state.adminTab==='products'?'active':''}" data-action="admin-tab" data-tab="products">Produtos</button><button class="${state.adminTab==='import'?'active':''}" data-action="admin-tab" data-tab="import">Importar dados</button><button class="${state.adminTab==='clients'?'active':''}" data-action="admin-tab" data-tab="clients">Clientes</button></aside><section id="adminContent"></section></div></main>`}
async function renderAdmin(){const c=document.getElementById('adminContent');if(!c)return;if(state.adminTab==='orders')await adminOrders(c);if(state.adminTab==='products')await adminProducts(c);if(state.adminTab==='import')adminImport(c);if(state.adminTab==='clients')await adminClients(c)}
async function adminOrders(c){
  const {data,error}=await sb.from('orders').select('id,status,notes,created_at,client_id,delivery_address_id,delivery_address_label,delivery_address_line1,delivery_address_line2,delivery_postal_code,delivery_postal_locality,delivery_country,profiles(full_name,email,nif,address),order_items(product_name,sku,quantity)').order('created_at',{ascending:false});
  if(error){c.innerHTML=`<div class="panel danger">${esc(error.message)}</div>`;return}
  window.__adminOrders=data||[];
  const counts={new:0,processing:0,completed:0,cancelled:0};
  window.__adminOrders.forEach(o=>counts[o.status]=(counts[o.status]||0)+1);
  c.innerHTML=`<div class="stats"><div class="stat"><div class="hint">Novas</div><div class="stat-num">${counts.new}</div></div><div class="stat"><div class="hint">Em preparação</div><div class="stat-num">${counts.processing}</div></div><div class="stat"><div class="hint">Concluídas</div><div class="stat-num">${counts.completed}</div></div></div><div class="panel"><h2 class="panel-title">Encomendas</h2><p class="hint">Pesquise, filtre e ordene as encomendas. As alterações de estado e o reenvio do email continuam disponíveis.</p><div class="toolbar admin-list-toolbar" style="margin-top:14px"><input id="adminOrderSearch" class="field search" placeholder="Pesquisar por cliente, NIF, email, ID ou produto..." data-action="filter-admin-orders"><select id="adminOrderStatus" class="field category" data-action="filter-admin-orders"><option value="">Todos os estados</option><option value="new">Novo</option><option value="processing">Em preparação</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option></select><select id="adminOrderSort" class="field sort" data-action="filter-admin-orders"><option value="date_desc">Data mais recente</option><option value="date_asc">Data mais antiga</option><option value="client_asc">Cliente A–Z</option><option value="client_desc">Cliente Z–A</option><option value="status_asc">Estado A–Z</option><option value="status_desc">Estado Z–A</option></select></div><div id="adminOrdersSummary" class="hint" style="margin:-7px 0 12px"></div><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Cliente</th><th>Produtos</th><th>Estado</th><th>Ações</th></tr></thead><tbody id="adminOrdersBody"></tbody></table></div></div>`;
  renderAdminOrderRows(filteredAdminOrders());
}
function orderStatusLabel(status){return ({new:'Novo',processing:'Em preparação',completed:'Concluída',cancelled:'Cancelada'})[status]||status||'—'}
function adminOrderSearchText(o){return [o.id,o.client_id,o.profiles?.full_name,o.profiles?.email,o.profiles?.nif,o.delivery_address_label,o.delivery_address_line1,o.delivery_address_line2,o.delivery_postal_code,o.delivery_postal_locality,o.delivery_country,...(o.order_items||[]).flatMap(i=>[i.product_name,i.sku,i.quantity])].filter(v=>v!==null&&v!==undefined).join(' ').toLocaleLowerCase('pt-PT')}
function filteredAdminOrders(){
  const all=window.__adminOrders||[];
  const q=String(document.getElementById('adminOrderSearch')?.value||'').trim().toLocaleLowerCase('pt-PT');
  const status=String(document.getElementById('adminOrderStatus')?.value||'');
  const sort=String(document.getElementById('adminOrderSort')?.value||'date_desc');
  const list=all.filter(o=>(!q||adminOrderSearchText(o).includes(q))&&(!status||o.status===status));
  const name=o=>String(o.profiles?.full_name||'').toLocaleLowerCase('pt-PT');
  const statusName=o=>orderStatusLabel(o.status).toLocaleLowerCase('pt-PT');
  list.sort((a,b)=>{if(sort==='date_asc')return new Date(a.created_at)-new Date(b.created_at);if(sort==='client_asc')return name(a).localeCompare(name(b),'pt');if(sort==='client_desc')return name(b).localeCompare(name(a),'pt');if(sort==='status_asc')return statusName(a).localeCompare(statusName(b),'pt');if(sort==='status_desc')return statusName(b).localeCompare(statusName(a),'pt');return new Date(b.created_at)-new Date(a.created_at)});
  return list;
}
function renderAdminOrderRows(list){const body=document.getElementById('adminOrdersBody');if(!body)return;const summary=document.getElementById('adminOrdersSummary');if(summary)summary.textContent=`${list.length} de ${(window.__adminOrders||[]).length} encomenda${(window.__adminOrders||[]).length===1?'':'s'}`;body.innerHTML=list.length?list.map(o=>`<tr><td>${new Date(o.created_at).toLocaleString('pt-PT')}</td><td><strong>${esc(o.profiles?.full_name||'—')}</strong><br>${esc(o.profiles?.nif||'')}<br><span class="hint">${esc(o.profiles?.email||'')}</span><br><span class="hint">Entrega: ${esc([o.delivery_address_line1,o.delivery_address_line2,o.delivery_postal_code,o.delivery_postal_locality,o.delivery_country].filter(Boolean).join(', ')||'—')}</span></td><td>${(o.order_items||[]).map(i=>`${esc(i.product_name)} × ${i.quantity}`).join('<br>')}</td><td><select class="field" style="width:auto;padding:7px" data-action="order-status" data-id="${esc(o.id)}">${[['new','Novo'],['processing','Em preparação'],['completed','Concluída'],['cancelled','Cancelada']].map(([s,label])=>`<option value="${s}" ${o.status===s?'selected':''}>${label}</option>`).join('')}</select></td><td><button class="btn btn-light btn-small" data-action="resend-email" data-id="${esc(o.id)}">Reenviar email</button></td></tr>`).join(''):'<tr><td colspan="5"><div class="empty">Não foram encontradas encomendas com os critérios selecionados.</div></td></tr>'}
function filterAdminOrders(){renderAdminOrderRows(filteredAdminOrders())}

async function updateOrderStatus(id,status){const {error}=await sb.from('orders').update({status}).eq('id',id);if(error)toast(error.message);else toast('Estado atualizado.')}
async function resendEmail(id){const {error}=await sb.functions.invoke('send-order-email',{body:{order_id:id}});toast(error?'Não foi possível enviar o email.':'Email reenviado.')}

async function adminProducts(c){const {data,error}=await sb.from('products').select('*').order('name');if(error){c.innerHTML=`<div class="panel danger">${esc(error.message)}</div>`;return}window.__adminProducts=data||[];window.__selectedProducts=new Set(window.__selectedProducts||[]);const cats=[...new Set((data||[]).map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'));c.innerHTML=`<div class="panel"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><h2 class="panel-title">Produtos</h2><p class="hint">${data?.length||0} registos · sem preços no catálogo.</p></div><button class="btn btn-primary" data-action="new-product">Novo produto</button></div><div class="toolbar" style="margin-top:14px"><input id="adminProductSearch" class="field search" placeholder="Pesquisar em todos os produtos..." data-action="filter-admin"><select id="adminProductCategory" class="field category" data-action="filter-admin"><option value="">Todas as categorias</option>${cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')} </select><select id="adminProductSort" class="field" data-action="filter-admin"><option value="name_asc">Ordenar: Nome A–Z</option><option value="name_desc">Ordenar: Nome Z–A</option><option value="sku_asc">Ordenar: ID do produto A–Z</option><option value="sku_desc">Ordenar: ID do produto Z–A</option><option value="category_asc">Ordenar: Categoria A–Z</option><option value="category_desc">Ordenar: Categoria Z–A</option></select></div><div class="bulkbar"><label><input id="selectAllProducts" type="checkbox" data-action="toggle-all-admin"> Selecionar todos os visíveis</label><span id="selectedCount" class="hint">0 selecionados</span><button class="btn btn-light btn-small" data-action="bulk-stock" data-value="true">Marcar Em stock</button><button class="btn btn-light btn-small" data-action="bulk-stock" data-value="false">Marcar Fora de stock</button><button class="btn btn-light btn-small" data-action="bulk-active" data-value="true">Publicar selecionados</button><button class="btn btn-light btn-small" data-action="bulk-active" data-value="false">Ocultar selecionados</button><button class="btn btn-light btn-small" data-action="select-products-with-images">Selecionar com imagem</button><button class="btn btn-danger btn-small" data-action="bulk-delete-images">Apagar imagens selecionadas</button><button class="btn btn-danger btn-small" data-action="bulk-delete-products">Eliminar produtos selecionados</button></div><div id="bulkResult" class="hint" style="margin:8px 0"></div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th></th><th>ID do produto</th><th>Imagem</th><th>Produto</th><th>Categoria</th><th>Estado</th><th>Stock físico</th><th>Visível</th><th></th></tr></thead><tbody id="adminProductsBody"></tbody></table></div></div>`;renderAdminProductRows(filteredAdminProducts())}
function filteredAdminProducts(){const q=(document.getElementById('adminProductSearch')?.value||'').toLowerCase().trim(),c=document.getElementById('adminProductCategory')?.value||'',sort=document.getElementById('adminProductSort')?.value||'name_asc';let list=(window.__adminProducts||[]).filter(p=>{if(c&&p.category!==c)return false;if(!q)return true;return [p.sku,p.name,p.category,p.barcode,p.short_description,p.stock_quantity,p.in_stock?'em stock':'fora de stock',p.active?'sim':'não'].filter(v=>v!==null&&v!==undefined).join(' ').toLowerCase().includes(q)});const cmpText=(a,b)=>String(a??'').localeCompare(String(b??''),'pt',{numeric:true,sensitivity:'base'});switch(sort){case 'name_desc':list.sort((a,b)=>cmpText(b.name,a.name));break;case 'sku_asc':list.sort((a,b)=>cmpText(a.sku,b.sku));break;case 'sku_desc':list.sort((a,b)=>cmpText(b.sku,a.sku));break;case 'category_asc':list.sort((a,b)=>cmpText(a.category,b.category)||cmpText(a.name,b.name));break;case 'category_desc':list.sort((a,b)=>cmpText(b.category,a.category)||cmpText(a.name,b.name));break;default:list.sort((a,b)=>cmpText(a.name,b.name))}return list}
function filterAdminProducts(){renderAdminProductRows(filteredAdminProducts())}
function openProductImagePreview(id){
  const p=(window.__adminProducts||[]).find(x=>x.id===id);
  if(!p?.image_url)return;
  document.getElementById('imagePreviewModal')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="imagePreviewModal" class="modal open image-preview-modal" data-action="close-image-preview"><div class="image-preview-card"><div class="modal-head"><div><div class="eyebrow">Imagem do produto</div><h2 style="margin:4px 0">${esc(p.name||'Produto')}</h2><div class="sku">Ref. ${esc(p.sku||'—')}</div></div><button class="btn btn-light" data-action="close-image-preview">Fechar</button></div><div class="image-preview-body"><img src="${esc(p.image_url)}" alt="${esc(p.name||'Produto')}"></div></div></div>`);
}
function renderAdminProductRows(list){const body=document.getElementById('adminProductsBody');if(!body)return;body.innerHTML=list.length?list.map(p=>`<tr><td><input type="checkbox" ${window.__selectedProducts?.has(p.id)?'checked':''} data-action="toggle-admin-product" data-id="${esc(p.id)}"></td><td><strong>${esc(p.sku||'—')}</strong></td><td>${p.image_url?`<button class="image-thumb-button" type="button" data-action="preview-product-image" data-id="${esc(p.id)}" title="Ver imagem"><img src="${esc(p.image_url)}" alt="Ver imagem" class="admin-image-thumb"></button>`:'—'}</td><td><strong>${esc(p.name||'—')}</strong></td><td>${esc(p.category||'—')}</td><td><span class="status ${p.in_stock?'done':'cancelled'}">${p.in_stock?'Em stock':'Fora de stock'}</span></td><td>${esc(p.stock_quantity??0)}</td><td><span class="status ${p.active?'done':''}">${p.active?'Sim':'Não'}</span></td><td><button class="btn btn-light btn-small" data-action="edit-product" data-id="${esc(p.id)}">Editar</button></td></tr>`).join(''):'<tr><td colspan="9"><div class="empty">Não foram encontrados produtos.</div></td></tr>';updateSelectedCount()}
function toggleAdminProduct(id,checked){window.__selectedProducts=window.__selectedProducts||new Set();checked?window.__selectedProducts.add(id):window.__selectedProducts.delete(id);updateSelectedCount()}
function toggleAllAdminProducts(checked){window.__selectedProducts=window.__selectedProducts||new Set();filteredAdminProducts().forEach(p=>checked?window.__selectedProducts.add(p.id):window.__selectedProducts.delete(p.id));renderAdminProductRows(filteredAdminProducts())}
function updateSelectedCount(){const el=document.getElementById('selectedCount');if(el)el.textContent=`${window.__selectedProducts?.size||0} selecionados`}
async function bulkSetProductsStock(inStock){const ids=[...(window.__selectedProducts||[])];const out=document.getElementById('bulkResult');if(!ids.length){if(out)out.textContent='Selecione pelo menos um produto.';return}const buttons=[...document.querySelectorAll('.bulkbar button')];buttons.forEach(b=>b.disabled=true);showProgress('A atualizar stock…',0,`0 de ${ids.length} produtos`);try{const {error}=await sb.from('products').update({in_stock:inStock}).in('id',ids);if(error)throw error;showProgress('A atualizar stock…',100,`${ids.length} de ${ids.length} produtos atualizados`);window.__selectedProducts.clear();await adminProducts(document.getElementById('adminContent'));toast(inStock?'Produtos marcados como Em stock.':'Produtos marcados como Fora de stock.');setTimeout(hideProgress,500)}catch(err){if(out)out.innerHTML=`<div class="notice danger">${esc(err.message||'Não foi possível atualizar o stock.')}</div>`;showProgress('Atualização interrompida',0,err.message||'Ocorreu um erro.');setTimeout(hideProgress,2200)}finally{buttons.forEach(b=>b.disabled=false)}}
function selectProductsWithImages(){
  window.__selectedProducts=new Set((window.__adminProducts||[]).filter(p=>String(p.image_url||'').trim()).map(p=>p.id));
  renderAdminProductRows(filteredAdminProducts());
  const out=document.getElementById('bulkResult');
  if(out)out.innerHTML=`<div class="notice">Selecionados <strong>${window.__selectedProducts.size}</strong> produtos que têm imagem.</div>`;
}
function storagePathFromImageUrl(url){
  const s=String(url||'');
  const marker='/storage/v1/object/public/product-images/';
  const i=s.indexOf(marker);
  if(i<0)return null;
  try{return decodeURIComponent(s.slice(i+marker.length).split('?')[0]);}catch{return s.slice(i+marker.length).split('?')[0];}
}
async function bulkDeleteProductImages(){
  const ids=[...(window.__selectedProducts||[])];
  const out=document.getElementById('bulkResult');
  const products=(window.__adminProducts||[]).filter(p=>ids.includes(p.id) && String(p.image_url||'').trim());
  if(!products.length){if(out)out.innerHTML='<div class="notice danger">Selecione produtos que tenham imagem.</div>';return}
  if(!state.profile||state.profile.role!=='admin'){if(out)out.innerHTML='<div class="notice danger">A sua conta não tem permissões de administrador.</div>';return}
  const ok=window.confirm(`Apagar as imagens de ${products.length} produto${products.length===1?'':'s'} selecionado${products.length===1?'':'s'}?\n\nEsta ação remove a imagem do catálogo e, quando a imagem estiver no armazenamento da aplicação, apaga também o ficheiro.`);
  if(!ok)return;
  const buttons=[...document.querySelectorAll('.bulkbar button')];
  buttons.forEach(b=>b.disabled=true);
  let removed=0,failed=0,external=0; const errors=[]; const total=products.length;
  showProgress('A apagar imagens…',0,`0 de ${total} imagens processadas`);
  if(out)out.innerHTML=`<div class="notice">A apagar imagens… <strong>0%</strong></div>`;
  try{
    for(let i=0;i<products.length;i++){
      const p=products[i];
      try{
        const path=storagePathFromImageUrl(p.image_url);
        if(path){
          const {error}=await sb.storage.from('product-images').remove([path]);
          if(error)throw error;
        }else{external++;}
        const {error:updateError}=await sb.from('products').update({image_url:null}).eq('id',p.id);
        if(updateError)throw updateError;
        removed++;
      }catch(err){failed++;errors.push(`${p.sku||p.name||p.id}: ${err.message||'erro desconhecido'}`)}
      const pct=progressFor(i+1,total);
      showProgress('A apagar imagens…',pct,`${i+1} de ${total} processadas`);
      if(out)out.innerHTML=`<div class="notice">A apagar imagens… <strong>${pct}%</strong><br>${i+1} de ${total} processadas · ${removed} removidas · ${failed} com erro.</div>`;
    }
    window.__selectedProducts.clear();
    await adminProducts(document.getElementById('adminContent'));
    showProgress('Imagens apagadas',100,`${removed} removidas · ${failed} com erro`);
    const details=errors.length?`<details style="margin-top:8px"><summary>Ver detalhes</summary><div class="hint" style="margin-top:6px">${errors.map(esc).join('<br>')}</div></details>`:'';
    if(out)out.innerHTML=`<div class="notice ${failed?'danger':'success'}"><strong>Operação concluída.</strong><br>${removed} imagens removidas do catálogo${external?` · ${external} eram imagens externas e apenas foram desligadas do catálogo`:''}${failed?` · ${failed} com erro`:''}.${details}</div>`;
    toast(`${removed} imagens removidas.`);
    setTimeout(hideProgress,1000);
  }catch(err){
    console.error(err);
    if(out)out.innerHTML=`<div class="notice danger"><strong>Falha ao apagar imagens.</strong><br>${esc(err.message||'Erro desconhecido')}</div>`;
    showProgress('Operação interrompida',0,err.message||'Ocorreu um erro.');
    setTimeout(hideProgress,2500);
  }finally{buttons.forEach(b=>b.disabled=false)}
}

async function bulkDeleteSelectedProducts(){
  const ids=[...(window.__selectedProducts||[])];
  const out=document.getElementById('bulkResult');
  const products=(window.__adminProducts||[]).filter(p=>ids.includes(p.id));
  if(!products.length){if(out)out.innerHTML='<div class="notice danger">Selecione pelo menos um produto.</div>';return}
  if(!state.profile||state.profile.role!=='admin'){if(out)out.innerHTML='<div class="notice danger">A sua conta não tem permissões de administrador.</div>';return}
  const ok=window.confirm(`Eliminar definitivamente ${products.length} produto${products.length===1?'':'s'} selecionado${products.length===1?'':'s'}?\n\nOs produtos serão removidos do catálogo. Esta ação não pode ser anulada.`);
  if(!ok)return;
  const buttons=[...document.querySelectorAll('.bulkbar button')];buttons.forEach(b=>b.disabled=true);
  let deleted=0,failed=0,images=0;const errors=[];const total=products.length;
  showProgress('A eliminar produtos…',0,`0 de ${total} produtos processados`);
  if(out)out.innerHTML=`<div class="notice">A eliminar produtos… <strong>0%</strong></div>`;
  try{
    for(let i=0;i<products.length;i++){
      const p=products[i];
      try{
        const {error}=await sb.from('products').delete().eq('id',p.id);
        if(error)throw error;
        deleted++;
        const path=storagePathFromImageUrl(p.image_url);
        if(path){
          const {error:imageError}=await sb.storage.from('product-images').remove([path]);
          if(!imageError)images++;
          else errors.push(`${p.sku||p.name||p.id}: produto eliminado, mas não foi possível apagar a imagem (${imageError.message||'erro no armazenamento'})`);
        }
      }catch(err){failed++;errors.push(`${p.sku||p.name||p.id}: ${err.message||'erro desconhecido'}`)}
      const pct=progressFor(i+1,total);showProgress('A eliminar produtos…',pct,`${i+1} de ${total} processados`);
      if(out)out.innerHTML=`<div class="notice">A eliminar produtos… <strong>${pct}%</strong><br>${i+1} de ${total} processados · ${deleted} eliminados · ${failed} com erro.</div>`;
    }
    window.__selectedProducts.clear();
    await adminProducts(document.getElementById('adminContent'));
    showProgress('Eliminação concluída',100,`${deleted} produtos eliminados`);
    const details=errors.length?`<details style="margin-top:8px"><summary>Ver detalhes</summary><div class="hint" style="margin-top:6px">${errors.map(esc).join('<br>')}</div></details>`:'';
    if(out)out.innerHTML=`<div class="notice ${failed?'danger':'success'}"><strong>Operação concluída.</strong><br>${deleted} produto${deleted===1?'':'s'} eliminado${deleted===1?'':'s'}${images?` · ${images} imagens apagadas do armazenamento`:''}${failed?` · ${failed} com erro`:''}.${details}</div>`;
    toast(`${deleted} produto${deleted===1?'':'s'} eliminado${deleted===1?'':'s'}.`);
    setTimeout(hideProgress,1000);
  }catch(err){
    console.error(err);if(out)out.innerHTML=`<div class="notice danger"><strong>Falha ao eliminar produtos.</strong><br>${esc(err.message||'Erro desconhecido')}</div>`;
    showProgress('Operação interrompida',0,err.message||'Ocorreu um erro.');setTimeout(hideProgress,2500);
  }finally{buttons.forEach(b=>b.disabled=false)}
}

async function bulkSetProductsActive(active){const ids=[...(window.__selectedProducts||[])];const out=document.getElementById('bulkResult');if(!ids.length){if(out)out.textContent='Selecione pelo menos um produto.';return}showProgress(active?'A publicar produtos…':'A ocultar produtos…',0,`0 de ${ids.length} produtos`);try{const {error}=await sb.from('products').update({active}).in('id',ids);if(error)throw error;showProgress(active?'A publicar produtos…':'A ocultar produtos…',100,`${ids.length} de ${ids.length} produtos atualizados`);window.__selectedProducts.clear();await adminProducts(document.getElementById('adminContent'));toast(active?'Produtos publicados.':'Produtos ocultados.');setTimeout(hideProgress,500)}catch(err){if(out)out.innerHTML=`<div class="notice danger">${esc(err.message||'Não foi possível atualizar os produtos.')}</div>`;showProgress('Atualização interrompida',0,err.message||'Ocorreu um erro.');setTimeout(hideProgress,2200)}}
function safeFileStem(name){return String(name||'').replace(/\.[^.]+$/,'').trim().toLowerCase()}
async function prepareProductImage(file){
  if(!file?.size) throw new Error('Ficheiro de imagem inválido.');
  const TARGET_W=800, TARGET_H=1000, PADDING=28;
  let source=null;
  try{
    if('createImageBitmap' in window) source=await createImageBitmap(file,{imageOrientation:'from-image'});
  }catch(_){source=null}
  if(!source){
    source=await new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file),img=new Image();
      img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível ler a imagem.'))};
      img.src=url;
    });
  }
  const sw=source.width||source.naturalWidth, sh=source.height||source.naturalHeight;
  if(!sw||!sh) throw new Error('A imagem não tem dimensões válidas.');
  const canvas=document.createElement('canvas');
  canvas.width=TARGET_W; canvas.height=TARGET_H;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('O navegador não permite preparar a imagem.');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,TARGET_W,TARGET_H);
  const scale=Math.min((TARGET_W-PADDING*2)/sw,(TARGET_H-PADDING*2)/sh);
  const dw=Math.max(1,Math.round(sw*scale)), dh=Math.max(1,Math.round(sh*scale));
  const dx=Math.round((TARGET_W-dw)/2), dy=Math.round((TARGET_H-dh)/2);
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  ctx.drawImage(source,dx,dy,dw,dh);
  if(source.close)source.close();
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Não foi possível preparar a imagem.')),'image/jpeg',0.92));
  return new File([blob],`${String(file.name||'produto').replace(/\.[^.]+$/,'')}.jpg`,{type:'image/jpeg',lastModified:Date.now()});
}

async function bulkUploadProductImages(files){
  const list=[...(files||[])];
  const out=document.getElementById('bulkResult');
  const input=document.querySelector('input[data-action="bulk-upload-images"]');
  if(!list.length){if(out)out.innerHTML='<div class="notice danger">Não foram selecionadas fotografias.</div>';return}
  if(!state.profile||state.profile.role!=='admin'){if(out)out.innerHTML='<div class="notice danger">A sua conta não tem permissões de administrador.</div>';return}
  const products=window.__adminProducts||[];
  let done=0,missing=0,failed=0;
  const errors=[];
  const total=list.length;
  showProgress('A carregar fotografias…',0,`0 de ${total} fotografias processadas`);
  if(out)out.innerHTML=`<div class="notice">A preparar ${total} fotografia${total===1?'':'s'}… <strong>0%</strong></div>`;
  try{
    for(let i=0;i<total;i++){
      const file=list[i];
      const stem=safeFileStem(file.name);
      const compact=stem.replace(/[^a-z0-9]/g,'');
      const p=products.find(x=>{
        const sku=safeFileStem(x.sku), skuCompact=sku.replace(/[^a-z0-9]/g,'');
        return sku===stem||skuCompact===compact;
      });
      if(!p){missing++;errors.push(`${file.name}: não foi encontrada a referência correspondente.`);showProgress('A carregar fotografias…',progressFor(i+1,total),`${i+1} de ${total} processadas · ${file.name} — sem correspondência`);continue}
      try{
        const prepared=await prepareProductImage(file);
        const path=`products/${String(p.sku).replace(/[^a-zA-Z0-9_-]/g,'_')}-${crypto.randomUUID()}.jpg`;
        const up=await sb.storage.from('product-images').upload(path,prepared,{upsert:false,contentType:'image/jpeg'});
        if(up.error)throw up.error;
        const imageUrl=sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        const {error}=await sb.from('products').update({image_url:imageUrl}).eq('id',p.id);
        if(error)throw error;
        done++;
      }catch(err){failed++;errors.push(`${file.name}: ${err.message||'erro desconhecido'}`)}
      const pct=progressFor(i+1,total);
      showProgress('A carregar fotografias…',pct,`${i+1} de ${total} processadas · ${file.name}`);
      if(out)out.innerHTML=`<div class="notice">A carregar fotografias… <strong>${pct}%</strong><br>${i+1} de ${total} processadas · ${done} associadas · ${missing} sem correspondência · ${failed} com erro.</div>`;
    }
    if(state.adminTab==='products') await adminProducts(document.getElementById('adminContent'));
    showProgress('Fotografias concluídas',100,`${done} associadas · ${missing} sem correspondência · ${failed} com erro`);
    if(out){const details=errors.length?`<details style="margin-top:8px"><summary>Ver detalhes</summary><div class="hint" style="margin-top:6px">${errors.map(esc).join('<br>')}</div></details>`:'';out.innerHTML=`<div class="notice ${failed||missing?'danger':'success'}"><strong>Carregamento concluído.</strong><br>${done} associadas · ${missing} sem correspondência · ${failed} com erro.${details}</div>`}
    toast(`${done} fotografias associadas.`);
    setTimeout(hideProgress,1000);
  }catch(err){
    console.error(err);
    if(out)out.innerHTML=`<div class="notice danger"><strong>Falha no carregamento.</strong><br>${esc(err.message||'Erro desconhecido')}</div>`;
    showProgress('Carregamento interrompido',0,err.message||'Ocorreu um erro.');
    setTimeout(hideProgress,2500);
  }finally{
    if(input)input.value='';
  }
}

async function adminClients(c){
  const {data,error}=await sb.from('profiles').select('id,email,full_name,nif,phone_country_code,phone_number,address,address_line1,address_line2,postal_code,postal_locality,country,role,created_at').order('created_at',{ascending:false});
  if(error){c.innerHTML=`<div class="panel danger">${esc(error.message)}</div>`;return}
  window.__adminClients=data||[];
  c.innerHTML=`<div class="panel"><h2 class="panel-title">Clientes</h2><p class="hint">Dados necessários à identificação e faturação do cliente. A conta de administrador atualmente autenticada não pode ser eliminada.</p>
    <div class="toolbar admin-list-toolbar client-filter-toolbar" style="margin-top:14px">
      <input id="adminClientSearch" class="field search" placeholder="Pesquisar em todos os campos..." data-action="filter-admin-clients">
      <select id="adminClientSort" class="field sort" data-action="filter-admin-clients">
        <option value="created_desc">Registo mais recente</option><option value="created_asc">Registo mais antigo</option>
        <option value="name_asc">Nome A–Z</option><option value="name_desc">Nome Z–A</option>
        <option value="nif_asc">NIF A–Z</option><option value="nif_desc">NIF Z–A</option>
        <option value="email_asc">Email A–Z</option><option value="email_desc">Email Z–A</option>
        <option value="phone_asc">Telemóvel A–Z</option><option value="phone_desc">Telemóvel Z–A</option>
        <option value="address_asc">Morada A–Z</option><option value="address_desc">Morada Z–A</option>
      </select>
    </div>
    <div class="client-column-filters" aria-label="Filtros por coluna">
      <input id="adminClientName" class="field" placeholder="Nome" data-action="filter-admin-clients">
      <input id="adminClientNif" class="field" placeholder="NIF" data-action="filter-admin-clients">
      <input id="adminClientEmail" class="field" placeholder="Email" data-action="filter-admin-clients">
      <input id="adminClientPhone" class="field" placeholder="Telemóvel" data-action="filter-admin-clients">
      <input id="adminClientAddress" class="field" placeholder="Morada" data-action="filter-admin-clients">
      <input id="adminClientDate" class="field" type="date" aria-label="Data de registo" data-action="filter-admin-clients">
    </div>
    <div id="adminClientsSummary" class="hint" style="margin:-1px 0 12px"></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>NIF</th><th>Email</th><th>Telemóvel</th><th>Morada</th><th>Registo</th><th>Ações</th></tr></thead><tbody id="adminClientsBody"></tbody></table></div></div>`;
  renderAdminClientRows(window.__adminClients);
}

function adminClientFields(p){
  return {
    name:String(p.full_name||''), nif:String(p.nif||''), email:String(p.email||''),
    phone:String(((p.phone_country_code||'')+' '+(p.phone_number||'')).trim()),
    address:String(profileAddress(p)||''), date:p.created_at?new Date(p.created_at):null
  };
}

function filterAdminClients(){
  const all=window.__adminClients||[];
  const search=String(document.getElementById('adminClientSearch')?.value||'').trim().toLocaleLowerCase('pt-PT');
  const filters={
    name:String(document.getElementById('adminClientName')?.value||'').trim().toLocaleLowerCase('pt-PT'),
    nif:String(document.getElementById('adminClientNif')?.value||'').trim().toLocaleLowerCase('pt-PT'),
    email:String(document.getElementById('adminClientEmail')?.value||'').trim().toLocaleLowerCase('pt-PT'),
    phone:String(document.getElementById('adminClientPhone')?.value||'').trim().toLocaleLowerCase('pt-PT'),
    address:String(document.getElementById('adminClientAddress')?.value||'').trim().toLocaleLowerCase('pt-PT'),
    date:String(document.getElementById('adminClientDate')?.value||'')
  };
  let list=all.filter(p=>{
    const f=adminClientFields(p);
    const hay=[f.name,f.nif,f.email,f.phone,f.address,f.date?f.date.toLocaleDateString('pt-PT'):''].join(' ').toLocaleLowerCase('pt-PT');
    return (!search||hay.includes(search)) && (!filters.name||f.name.toLocaleLowerCase('pt-PT').includes(filters.name)) && (!filters.nif||f.nif.toLocaleLowerCase('pt-PT').includes(filters.nif)) && (!filters.email||f.email.toLocaleLowerCase('pt-PT').includes(filters.email)) && (!filters.phone||f.phone.toLocaleLowerCase('pt-PT').includes(filters.phone)) && (!filters.address||f.address.toLocaleLowerCase('pt-PT').includes(filters.address)) && (!filters.date|| (f.date && f.date.toISOString().slice(0,10)===filters.date));
  });
  const sort=String(document.getElementById('adminClientSort')?.value||'created_desc');
  const cmp=(a,b)=>String(a??'').localeCompare(String(b??''),'pt',{numeric:true,sensitivity:'base'});
  list.sort((a,b)=>{const fa=adminClientFields(a),fb=adminClientFields(b);switch(sort){case 'created_asc':return (fa.date?.getTime()||0)-(fb.date?.getTime()||0);case 'name_asc':return cmp(fa.name,fb.name);case 'name_desc':return cmp(fb.name,fa.name);case 'nif_asc':return cmp(fa.nif,fb.nif);case 'nif_desc':return cmp(fb.nif,fa.nif);case 'email_asc':return cmp(fa.email,fb.email);case 'email_desc':return cmp(fb.email,fa.email);case 'phone_asc':return cmp(fa.phone,fb.phone);case 'phone_desc':return cmp(fb.phone,fa.phone);case 'address_asc':return cmp(fa.address,fb.address);case 'address_desc':return cmp(fb.address,fa.address);default:return (fb.date?.getTime()||0)-(fa.date?.getTime()||0)}});
  renderAdminClientRows(list);
}

function renderAdminClientRows(list){
  const body=document.getElementById('adminClientsBody');if(!body)return;
  const summary=document.getElementById('adminClientsSummary');if(summary)summary.textContent=`${list.length} de ${(window.__adminClients||[]).length} cliente${(window.__adminClients||[]).length===1?'':'s'}`;
  body.innerHTML=list.length?list.map(p=>`<tr><td><strong>${esc(p.full_name||'—')}</strong></td><td>${esc(p.nif||'—')}</td><td>${esc(p.email||'—')}</td><td>${esc((p.phone_country_code||'')+' '+(p.phone_number||'')).trim()||'—'}</td><td>${esc(profileAddress(p))}</td><td>${p.created_at?new Date(p.created_at).toLocaleDateString('pt-PT'):'—'}</td><td><div class="client-actions"><button class="btn btn-light btn-small" data-action="client-history" data-id="${esc(p.id)}">Histórico</button><button class="btn btn-light btn-small" data-action="client-reset-password" data-id="${esc(p.id)}">Reset password</button>${p.id===state.session.user.id?'<span class="hint">Conta atual</span>':'<button class="btn btn-danger btn-small" data-action="client-delete" data-id="'+esc(p.id)+'">Eliminar</button>'}</div></td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">Não foram encontrados clientes com os critérios selecionados.</div></td></tr>';
}

async function invokeClientAdmin(action,clientId){
  const {data,error}=await sb.functions.invoke('admin-client-management',{body:{action,client_id:clientId}});
  if(error){
    console.error('admin-client-management',error);
    let detail='';
    try{if(error.context?.clone){const r=await error.context.clone();const body=await r.json();detail=body?.error||''}}catch(_){}
    const msg=String(detail||error.message||'');
    if(/failed to send a request|failed to fetch|network|fetch/i.test(msg)){
      throw new Error('Não foi possível contactar a função de administração. Confirme que a Edge Function “admin-client-management” está publicada no Supabase.');
    }
    throw new Error(msg||'Não foi possível executar a operação de administração.');
  }
  if(data?.error)throw new Error(data.error);
  return data;
}

async function showClientHistory(id){
  const client=(await sb.from('profiles').select('id,email,full_name,nif').eq('id',id).single()).data;
  const {data,error}=await sb.from('orders').select('id,status,notes,created_at,delivery_address_label,delivery_address_line1,delivery_address_line2,delivery_postal_code,delivery_postal_locality,delivery_country,order_items(product_name,sku,quantity)').eq('client_id',id).order('created_at',{ascending:false});
  if(error){toast(error.message);return}
  document.body.insertAdjacentHTML('beforeend',`<div id="clientHistoryModal" class="modal open"><div class="modal-card" style="width:min(900px,100%)"><div class="modal-head"><div><div class="eyebrow">Histórico do cliente</div><h2 style="margin:4px 0">${esc(client?.full_name||'Cliente')}</h2><div class="hint">${esc(client?.nif||'')} · ${esc(client?.email||'')}</div></div><button class="btn btn-light" data-action="close-client-history">Fechar</button></div><div class="modal-body">${data?.length?data.map(o=>`<div class="panel" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:10px"><strong>Encomenda #${esc(o.id.slice(0,8))}</strong><span class="status ${o.status==='completed'?'done':o.status==='cancelled'?'cancelled':''}">${esc(orderStatusLabel(o.status))}</span></div><div class="hint" style="margin:5px 0 10px">${new Date(o.created_at).toLocaleString('pt-PT')}</div><div class="hint" style="margin-bottom:8px">Entrega: ${esc([o.delivery_address_line1,o.delivery_address_line2,o.delivery_postal_code,o.delivery_postal_locality,o.delivery_country].filter(Boolean).join(', ')||'—')}</div>${(o.order_items||[]).map(i=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #eee7ef"><span>${esc(i.product_name)} <span class="hint">(${esc(i.sku||'')})</span></span><strong>${i.quantity}</strong></div>`).join('')}${o.notes?`<div class="hint" style="margin-top:8px">Obs.: ${esc(o.notes)}</div>`:''}</div>`).join(''):'<div class="empty">Este cliente ainda não tem encomendas.</div>'}</div></div></div>`)
}

async function resetClientPassword(id){
  if(!confirm('Fazer reset à palavra-passe deste cliente? A palavra-passe atual deixará de funcionar e será criada uma palavra-passe temporária.'))return;
  try{const data=await invokeClientAdmin('reset_password',id);document.body.insertAdjacentHTML('beforeend',`<div id="tempPasswordModal" class="modal open"><div class="modal-card"><div class="modal-head"><div><div class="eyebrow">Reset de palavra-passe</div><h2 style="margin:4px 0">Reset concluído</h2></div><button class="btn btn-light" data-action="close-temp-password">Fechar</button></div><div class="modal-body"><div class="notice success">O cliente terá de escolher uma nova palavra-passe no próximo login.</div><div class="form-group" style="margin-top:16px"><label class="label">Palavra-passe temporária</label><input class="field" readonly value="${esc(data.temporary_password||'')}"></div><p class="hint" style="margin-top:10px">Comunique esta palavra-passe ao cliente por um canal seguro. Não a envie por email a partir desta página.</p></div></div></div>`);toast('Reset de palavra-passe concluído.')}catch(err){toast(err.message||'Não foi possível fazer o reset.')}
}

async function deleteClient(id){
  if(id===state.session.user.id){toast('A sua própria conta de administrador não pode ser eliminada.');return}
  const row=(await sb.from('profiles').select('full_name,email').eq('id',id).single()).data;
  if(!confirm(`Eliminar definitivamente a conta de ${row?.full_name||row?.email||'este cliente'}? As encomendas serão mantidas no histórico e deixarão de estar associadas a uma conta ativa.`))return;
  try{await invokeClientAdmin('delete_client',id);state.selectedClientId=null;toast('Cliente eliminado.');await renderAdmin()}catch(err){toast(err.message||'Não foi possível eliminar o cliente.')}
}


async function render(){
  // A preferência de idioma é global à aplicação e deve sobreviver à autenticação.
  // Recarregamo-la sempre antes de renderizar para garantir que a escolha feita
  // no login é a mesma usada nas páginas autenticadas.
  const storedLanguage=localStorage.getItem('consuldoce_language');
  if(storedLanguage==='zh-CN'||storedLanguage==='pt') state.language=storedLanguage;
  document.documentElement.lang=state.language==='zh-CN'?'zh-CN':'pt-PT';
  if(!state.session){await loadCountryNames();app.innerHTML=auth();document.getElementById('authForm')?.addEventListener('submit',doAuth);window.CONSULDOCE_I18N?.translatePage();return}if(state.route==='#/admin' && state.profile?.role!=='admin'){state.route='#/catalog'}if(state.route==='#/force-password'){app.innerHTML=forcePassword();document.getElementById('forcePasswordForm')?.addEventListener('submit',changeForcedPassword);window.CONSULDOCE_I18N?.translatePage();return}if(state.route==='#/admin'){app.innerHTML=admin();await renderAdmin()}else if(state.route==='#/account'){await loadCountryNames();app.innerHTML=account();document.getElementById('accountProfileForm')?.addEventListener('submit',saveAccountProfile);document.getElementById('accountPasswordForm')?.addEventListener('submit',changeAccountPassword)}else{await loadProducts();app.innerHTML=catalog();filterProducts()}window.CONSULDOCE_I18N?.translatePage()}


/* V28: restored functions accidentally removed during previous refactors. */
function openProductEditorById(id){const p=window.__adminProducts?.find(x=>x.id===id)||{};openProductEditor(p)}

function openProductEditor(p={}){const obj=JSON.stringify(p).replace(/</g,'\\u003c');document.body.insertAdjacentHTML('beforeend',`<div id="productModal" class="modal open"><div class="modal-card"><div class="modal-head"><div><div class="eyebrow">Catálogo</div><h2 style="margin:4px 0">${p.id?'Editar produto':'Novo produto'}</h2></div><button class="btn btn-light" data-action="close-product">Fechar</button></div><div class="modal-body"><form id="productForm" class="form-grid"><input type="hidden" name="id" value="${esc(p.id||'')}"><div class="form-group"><label class="label">Referência / SKU</label><input class="field" name="sku" required value="${esc(p.sku||'')}"></div><div class="form-group"><label class="label">Categoria</label><input class="field" name="category" value="${esc(p.category||'')}"></div><div class="form-group full"><label class="label">Nome do produto</label><input class="field" name="name" required value="${esc(p.name||'')}"></div><div class="form-group full"><label class="label">Descrição curta</label><input class="field" name="short_description" value="${esc(p.short_description||'')}"></div><div class="form-group"><label class="label">Stock físico</label><input class="field" name="stock_quantity" type="number" min="0" step="1" value="${esc(p.stock_quantity??0)}"></div><div class="form-group"><label class="label">Preço interno</label><input class="field" name="catalog_price" type="number" min="0" step="0.01" value="${esc(p.catalog_price??'')}"><span class="hint">Nunca apresentado ao cliente; usado apenas para ordenação.</span></div><div class="form-group"><label class="label">Unidade</label><input class="field" name="unit" value="${esc(p.unit||'UNI')}"></div><div class="form-group"><label class="label">URL da imagem</label><input class="field" name="image_url" value="${esc(p.image_url||'')}" placeholder="https://..."></div><div class="form-group"><label class="label">Carregar imagem</label><input class="field" name="image_file" type="file" accept="image/*"></div><div class="form-group"><label class="label">Código de barras</label><input class="field" name="barcode" value="${esc(p.barcode||'')}"></div><div class="form-group"><label class="label">Opções</label><label style="font-size:12px"><input name="active" type="checkbox" ${p.active!==false?'checked':''}> Publicar no catálogo</label><label style="font-size:12px"><input name="in_stock" type="checkbox" ${p.in_stock?'checked':''}> Mostrar como <strong>Em stock</strong> e permitir encomenda</label></div><div class="form-group full"><button class="btn btn-primary" type="submit">Guardar produto</button></div></form></div></div></div>`);document.getElementById('productForm').addEventListener('submit',e=>saveProduct(e))}

async function saveProduct(e){e.preventDefault();const f=new FormData(e.target);const id=f.get('id');let imageUrl=f.get('image_url')||null;const file=f.get('image_file');try{if(file?.size){showProgress('A preparar fotografia…',15,'A redimensionar para o formato de catálogo 4:5');const prepared=await prepareProductImage(file);showProgress('A carregar fotografia…',55,'A guardar imagem otimizada');const path=`products/${crypto.randomUUID()}.jpg`;const up=await sb.storage.from('product-images').upload(path,prepared,{upsert:false,contentType:'image/jpeg'});if(up.error)throw up.error;imageUrl=sb.storage.from('product-images').getPublicUrl(path).data.publicUrl}const payload={sku:String(f.get('sku')).trim(),category:String(f.get('category')||'').trim()||'Outros',name:String(f.get('name')).trim(),short_description:String(f.get('short_description')||'').trim(),stock_quantity:Number(f.get('stock_quantity')||0),unit:String(f.get('unit')||'UNI').trim(),image_url:imageUrl,barcode:String(f.get('barcode')||'').trim()||null,active:f.get('active')==='on',in_stock:f.get('in_stock')==='on',catalog_price:f.get('catalog_price')===''?null:Number(f.get('catalog_price'))};let q=sb.from('products');const r=id?q.update(payload).eq('id',id):q.insert(payload);const {error}=await r;if(error)throw error;document.getElementById('productModal').remove();toast('Produto guardado.');renderAdmin();setTimeout(hideProgress,500)}catch(err){hideProgress();toast(err.message||'Erro ao guardar produto.')}}


function adminImport(c){c.innerHTML=`<div class="panel"><h2 class="panel-title">Importação Sage 50</h2><p class="hint">Separe as duas operações: use <strong>Artigos</strong> quando quiser atualizar o catálogo e <strong>Stock</strong> quando quiser apenas atualizar existências.</p><div class="tabs admin-import-tabs"><button class="tab ${state.importMode==='articles'?'active':''}" data-action="import-mode" data-mode="articles">Importar artigos</button><button class="tab ${state.importMode==='stock'?'active':''}" data-action="import-mode" data-mode="stock">Atualizar stock</button></div><div class="notice" style="margin-top:16px">${state.importMode==='articles'?'<strong>Importar artigos</strong><br>Selecione apenas a “Listagem de Artigos” do Sage. Cria/atualiza referências, nomes, famílias, unidades e códigos de barras. O stock existente não é alterado.':'<strong>Atualizar stock</strong><br>Selecione apenas o “Inventário de existências” do Sage. Atualiza exclusivamente as existências por referência (SKU), sem mexer nos restantes dados do produto.'}</div><div class="dropzone" style="margin:18px 0"><input id="excelFiles" class="file-input" type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"><label for="excelFiles"><strong>Selecionar ficheiro Excel</strong><br><span class="hint">${state.importMode==='articles'?'Listagem de Artigos':'Inventário de existências'}</span></label></div><div id="selectedFiles" class="hint" style="margin:0 0 15px">Nenhum ficheiro selecionado.</div>${state.importMode==='articles'?'<label style="display:block;font-size:12px;margin-bottom:15px"><input id="publishImported" type="checkbox" checked> Publicar automaticamente produtos normais</label>':''}<button id="importBtn" class="btn btn-primary" data-action="import-excel">${state.importMode==='articles'?'Importar / atualizar artigos':'Atualizar stock'}</button><div id="importResult" style="margin-top:15px"></div><div class="notice" style="margin-top:18px"><strong>Segurança:</strong> os preços e restantes campos comerciais do Excel não são publicados no catálogo.</div></div><div class="panel import-images-panel"><h2 class="panel-title">Importar fotografias em lote</h2><p class="hint">Selecione várias fotografias de uma vez. O nome do ficheiro deve corresponder à <strong>referência / ID do produto</strong>; a imagem é redimensionada para o formato do catálogo antes de ser guardada.</p><div class="dropzone" style="margin:18px 0"><input id="bulkImageFiles" class="file-input" type="file" accept="image/*" multiple data-action="bulk-upload-images"><label for="bulkImageFiles"><strong>Selecionar fotografias</strong><br><span class="hint">Pode selecionar várias imagens em simultâneo</span></label></div><div id="bulkResult" class="hint"></div></div>`;document.getElementById('excelFiles').addEventListener('change',e=>{const f=e.target.files?.[0];document.getElementById('selectedFiles').textContent=f?`Selecionado: ${f.name} (${Math.round(f.size/1024)} KB)`:'Nenhum ficheiro selecionado.'})}

let __xlsxPromise=null;

function loadXLSX(){if(window.XLSX)return Promise.resolve(window.XLSX);if(__xlsxPromise)return __xlsxPromise;__xlsxPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';script.crossOrigin='anonymous';script.onload=()=>window.XLSX?resolve(window.XLSX):reject(new Error('Não foi possível carregar o leitor Excel. Verifique a ligação à Internet ou recarregue a página.'));script.onerror=()=>reject(new Error('Não foi possível carregar o leitor Excel. Verifique a ligação à Internet ou recarregue a página.'));document.head.appendChild(script)});return __xlsxPromise}

function normKey(k){return String(k??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s_\-./]+/g,'').toLowerCase()}

function rowValue(row,...keys){const map=new Map(Object.keys(row).map(k=>[normKey(k),row[k]]));for(const k of keys){const v=map.get(normKey(k));if(v!==undefined&&v!==null&&String(v).trim()!=='')return v}return null}

function numeric(v){if(typeof v==='number'&&Number.isFinite(v))return v;const s=String(v??'').trim().replace(/\s/g,'').replace(',','.');const n=Number(s);return Number.isFinite(n)?n:0}

async function importExcel(){const file=document.getElementById('excelFiles')?.files?.[0];const out=document.getElementById('importResult');const btn=document.getElementById('importBtn');if(!file){out.innerHTML='<div class="notice danger">Selecione o ficheiro Excel correspondente à operação escolhida.</div>';return}if(!state.profile||state.profile.role!=='admin'){out.innerHTML='<div class="notice danger">A sua conta não tem permissões de administrador.</div>';return}btn.disabled=true;btn.textContent=state.importMode==='articles'?'A importar…':'A atualizar stock…';out.innerHTML='<div class="notice">A ler o ficheiro Excel…</div>';try{const XLSX=await loadXLSX();const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array',cellDates:true,raw:true});const ws=wb.Sheets[wb.SheetNames[0]];if(!ws)throw new Error('O ficheiro não contém uma folha de cálculo válida.');const rows=XLSX.utils.sheet_to_json(ws,{defval:null});if(!rows.length)throw new Error('O ficheiro não contém linhas de dados.');const keys=Object.keys(rows[0]).map(normKey);if(state.importMode==='articles'){const isListing=keys.includes(normKey('Produto'))&&keys.includes(normKey('Ref_'));if(!isListing)throw new Error('Este não parece ser o ficheiro “Listagem de Artigos”. Selecione a exportação de artigos do Sage.');const publish=document.getElementById('publishImported')?.checked;const products=rows.map((r,i)=>{const sku=String(rowValue(r,'Ref_')??'').trim();const name=String(rowValue(r,'Produto','Descricao Curta')??sku).trim();const category=String(rowValue(r,'Familia','Familia Completa')??'Outros').trim()||'Outros';const barcode=rowValue(r,'C_ Barras','Codigo Barras');const rawPrice=rowValue(r,'Preco','Preço','PVP','Preco Venda','Preço Venda','Preço de Venda');return {sku,name,short_description:String(rowValue(r,'Descricao Curta')??'').trim(),category,barcode:barcode==null?null:String(barcode).trim()||null,unit:String(rowValue(r,'Uni')??'UNI').trim()||'UNI',active:Boolean(publish)&&category.toUpperCase()!=='SERVIÇOS',track_stock:true,sort_order:i,...(rawPrice!=null?{catalog_price:numeric(rawPrice)}:{})}}).filter(p=>p.sku&&p.name);if(!products.length)throw new Error('A listagem foi lida, mas não contém artigos válidos com Ref_ e Produto.');let written=0;for(let i=0;i<products.length;i+=200){const batch=products.slice(i,i+200);const {error}=await sb.from('products').upsert(batch,{onConflict:'sku'});if(error)throw error;written+=batch.length}await loadProducts();out.innerHTML=`<div class="notice success"><strong>Artigos importados.</strong><br>${written} produtos criados/atualizados. O stock existente não foi alterado.<br><span class="hint">${esc(file.name)}</span></div>`;toast(`${written} artigos importados.`)}else{const isInventory=keys.includes(normKey('Ref_'))&&keys.includes(normKey('Qnt_ Existente'));if(!isInventory)throw new Error('Este não parece ser o ficheiro “Inventário de existências”. Selecione a exportação de inventário do Sage.');const updates=rows.map(r=>{const sku=String(rowValue(r,'Ref_')??'').trim();const stock=Math.max(0,Math.round(numeric(rowValue(r,'Qnt_ Existente'))));const barcode=rowValue(r,'Codigo Barras','C_ Barras');return {sku,stock_quantity:stock,barcode:barcode==null?undefined:String(barcode).trim()||null}}).filter(x=>x.sku);if(!updates.length)throw new Error('O inventário foi lido, mas não contém referências válidas.');let updated=0,missing=0;for(let i=0;i<updates.length;i+=100){const batch=updates.slice(i,i+100);for(const item of batch){const payload={stock_quantity:item.stock_quantity};if(item.barcode!==undefined)payload.barcode=item.barcode;const {data,error}=await sb.from('products').update(payload).eq('sku',item.sku).select('id');if(error)throw error;if(data?.length)updated++;else missing++}}await loadProducts();out.innerHTML=`<div class="notice success"><strong>Stock atualizado.</strong><br>${updated} referências atualizadas · ${missing} referências do Excel não existem no catálogo.<br><span class="hint">${esc(file.name)} · ${rows.length} linhas lidas</span></div>`;toast(`Stock atualizado em ${updated} referências.`)}}catch(err){console.error(err);out.innerHTML=`<div class="notice danger"><strong>Falha na importação.</strong><br>${esc(err.message||'Erro desconhecido')}</div>`}finally{btn.disabled=false;btn.textContent=state.importMode==='articles'?'Importar / atualizar artigos':'Atualizar stock'}}



window.setRoute=setRoute;window.logout=logout;window.openCart=openCart;window.closeCart=closeCart;window.changeQty=changeQty;window.setQty=setQty;window.openCheckout=openCheckout;window.closeCheckout=closeCheckout;window.submitOrder=submitOrder;window.openOrders=openOrders;window.filterProducts=filterProducts;window.state=state;window.render=render;window.renderAdmin=renderAdmin;window.openProductEditor=openProductEditor;window.openProductEditorById=openProductEditorById;window.updateOrderStatus=updateOrderStatus;window.resendEmail=resendEmail;window.importExcel=importExcel;window.saveProduct=saveProduct;window.showForgotPassword=showForgotPassword;window.bulkSetProductsActive=bulkSetProductsActive;window.bulkDeleteSelectedProducts=bulkDeleteSelectedProducts;window.bulkSetProductsStock=bulkSetProductsStock;window.toggleAdminProduct=toggleAdminProduct;window.toggleAllAdminProducts=toggleAllAdminProducts;window.filterAdminProducts=filterAdminProducts;window.bulkUploadProductImages=bulkUploadProductImages;window.selectProductsWithImages=selectProductsWithImages;window.bulkDeleteProductImages=bulkDeleteProductImages;window.saveAccountProfile=saveAccountProfile;window.changeAccountPassword=changeAccountPassword;


document.addEventListener('click',(event)=>{
  const el=event.target.closest('[data-action]');
  if(!el) return;
  const a=el.dataset.action;
  try{
    if(a==='route') setRoute(el.dataset.route);
    else if(a==='open-cart') openCart();
    else if(a==='toggle-language') toggleLanguage();
    else if(a==='logout') logout();
    else if(a==='auth-login') { const wasRecovery=state.recoveryFlow||state.authMode==='recovery'||isRecoveryLocation(); state.authMode='login'; if(wasRecovery){ state.recoveryFlow=false; sb?.auth.signOut().finally(()=>{state.session=null;state.profile=null;setRoute('#/login')}); } else setRoute('#/login'); }
    else if(a==='auth-login-render') { state.authMode='login'; render(); }
    else if(a==='auth-signup-render') { state.authMode='signup'; render(); }
    else if(a==='forgot-password') showForgotPassword();
    else if(a==='open-orders') openOrders();
    else if(a==='new-address') openAddressEditor();
    else if(a==='edit-address') openAddressEditor(el.dataset.id);
    else if(a==='close-address') document.getElementById('addressModal')?.remove();
    else if(a==='set-default-address') setDefaultAddress(el.dataset.id);
    else if(a==='delete-address') deleteAddress(el.dataset.id);
    else if(a==='close-cart') closeCart();
    else if(a==='open-checkout') openCheckout();
    else if(a==='close-checkout') closeCheckout();
    else if(a==='submit-order') submitOrder();
    else if(a==='close-orders') document.getElementById('ordersModal')?.remove();
    else if(a==='admin-tab') { state.adminTab=el.dataset.tab; render(); }
    else if(a==='registered-back-login'){state.authMode='login';history.replaceState(null,'',location.href.split('#')[0]+'#/login');render()}
    else if(a==='client-history') showClientHistory(el.dataset.id);
    else if(a==='client-reset-password') resetClientPassword(el.dataset.id);
    else if(a==='client-delete') deleteClient(el.dataset.id);
    else if(a==='delete-own-account') deleteOwnAccount();
    else if(a==='close-client-history') document.getElementById('clientHistoryModal')?.remove();
    else if(a==='close-temp-password') document.getElementById('tempPasswordModal')?.remove();
    else if(a==='new-product') openProductEditor();
    else if(a==='bulk-stock') bulkSetProductsStock(el.dataset.value==='true');
    else if(a==='bulk-active') bulkSetProductsActive(el.dataset.value==='true');
    else if(a==='select-products-with-images') selectProductsWithImages();
    else if(a==='bulk-delete-images') bulkDeleteProductImages();
    else if(a==='bulk-delete-products') bulkDeleteSelectedProducts();
    else if(a==='preview-product-image') openProductImagePreview(el.dataset.id);
    else if(a==='close-image-preview') document.getElementById('imagePreviewModal')?.remove();
    else if(a==='close-product') document.getElementById('productModal')?.remove();
    else if(a==='import-mode') { state.importMode=el.dataset.mode; render(); }
    else if(a==='import-excel') importExcel();
    else if(a==='resend-email') resendEmail(el.dataset.id);
    else if(a==='edit-product') openProductEditorById(el.dataset.id);
    else if(a==='qty-minus') changeQty(el.dataset.id,-1);
    else if(a==='qty-plus') changeQty(el.dataset.id,1);
    else if(a==='qty-add') setQty(el.dataset.id, Number(el.dataset.value || 1));
    else if(a==='cart-qty-minus') { changeQty(el.dataset.id,-1); openCart(); }
    else if(a==='cart-qty-plus') { changeQty(el.dataset.id,1); openCart(); }
    else if(a==='drawer-backdrop') { if(event.target===el) closeCart(); }
  } catch(err) { console.error('CONSULDOCE action error', a, err); }
});
document.addEventListener('input',(event)=>{
  const el=event.target.closest('[data-action]');
  if(!el) return;
  const a=el.dataset.action;
  try{
    if(a==='filter-products') filterProducts();
    else if(a==='set-qty') setQty(el.dataset.id, el.value);
    else if(a==='cart-set-qty') { setQty(el.dataset.id, el.value); openCart(); }
    else if(a==='filter-admin') filterAdminProducts();
    else if(a==='filter-admin-clients') filterAdminClients();
  } catch(err) { console.error('CONSULDOCE input action error', a, err); }
});
document.addEventListener('change',(event)=>{
  if(event.target?.id==='orderAddress'){updateCheckoutAddress();return}
  const el=event.target.closest('[data-action]');
  if(!el) return;
  const a=el.dataset.action;
  try{
    if(a==='filter-products') filterProducts();
    else if(a==='set-qty') setQty(el.dataset.id, el.value);
    else if(a==='cart-set-qty') { setQty(el.dataset.id, el.value); openCart(); }
    else if(a==='order-status') updateOrderStatus(el.dataset.id, el.value);
    else if(a==='order-address') updateCheckoutAddress();
    else if(a==='filter-admin') filterAdminProducts();
    else if(a==='filter-admin-clients') filterAdminClients();
    else if(a==='toggle-all-admin') toggleAllAdminProducts(el.checked);
    else if(a==='bulk-upload-images') bulkUploadProductImages(el.files);
    else if(a==='toggle-admin-product') toggleAdminProduct(el.dataset.id, el.checked);
  } catch(err) { console.error('CONSULDOCE change action error', a, err); }
});

window.addEventListener('popstate',()=>{if(state.authMode==='registered'){state.authMode='login';state.route='#/login';location.hash='#/login';render();}});
window.addEventListener('hashchange',()=>{state.route=location.hash||'#/catalog';if(state.authMode==='registered' && state.route!=='#/login'){state.authMode='login';}safeRender()});
let renderInFlight=false;
async function safeRender(){try{if(!app)return;await render()}catch(err){console.error('CONSULDOCE render error',err);if(app)app.innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="eyebrow">Erro de carregamento</div><h1 class="h1">Não foi possível abrir a aplicação</h1><p class="lead">Ocorreu um erro ao apresentar esta página. Recarregue e tente novamente.</p><div class="notice danger">${esc(err?.message||'Erro inesperado.')}</div></div></div>`}}
(async()=>{try{initSupabase();if(!cfg.SUPABASE_URL||!cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_URL.includes('SEU-PROJETO')){app.innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="eyebrow">Configuração</div><h1 class="h1">Ligar o catálogo ao Supabase</h1><p class="lead">Configure o URL e a chave pública do projeto Supabase em <strong>config.js</strong>.</p><div class="notice">Não coloque a <strong>service_role key</strong> no navegador.</div></div></div>`;return}if(isRecoveryLocation())state.authMode='recovery';app.innerHTML=auth();document.getElementById('authForm')?.addEventListener('submit',doAuth);window.CONSULDOCE_I18N?.translatePage();await Promise.race([loadSession(),new Promise(resolve=>setTimeout(resolve,8000))]);if(!state.session && !state.recoveryFlow && !app.innerHTML.trim()) safeRender()}catch(err){console.error('CONSULDOCE boot error',err);const msg=err?.message||'Erro inesperado ao iniciar a aplicação.';app.innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="eyebrow">Erro de carregamento</div><h1 class="h1">Não foi possível abrir o catálogo</h1><p class="lead">A aplicação foi carregada, mas não conseguiu concluir a ligação ao serviço. Tente recarregar a página.</p><div class="notice danger">${esc(msg)}</div></div></div>`}})();
