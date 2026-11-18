import {CONFIG,SOURCES,SERVICES} from './data.js?v=c20261118-3';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={mountains:'M2 20 9 5l6 11 3-6 5 10H2Zm4-9 3 3 3-3',ticket:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Zm12 0v14',bell:'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4M12 2v2',certificate:'M4 3h16v13H4V3Zm4 5h8m-8 4h5m1 4v6l3-2 3 2v-6',newspaper:'M3 4h15v16H5a2 2 0 0 1-2-2V4Zm15 4h3v10a2 2 0 0 1-2 2M7 8h7m-7 4h7m-7 4h4',compass:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm5-15-3 7-7 3 3-7 7-3Z'};
let service='guide',mountain='',prepared='';
$('#business-link').href=CONFIG.businessUrl;
$('#verified-date').textContent=`资料核验 ${CONFIG.verified}`;
$('#services').innerHTML=SERVICES.map(s=>`<button class="service ${s.color} ${s.id===service?'selected':''}" data-service="${s.id}" aria-pressed="${s.id===service}"><svg class="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[s.icon]}"/></svg><span class="title-3">${s.title}</span><span class="caption-5">${s.desc}</span><span class="small-arrow" aria-hidden="true">↗</span></button>`).join('');
const sourceHTML=s=>`<article class="source-card"><div class="source-top"><h3 class="title-3">${escape(s.title)}</h3><span class="badge">${escape(s.mountain)}</span></div><p class="body-6">${escape(s.summary)}</p><span class="caption-5">${escape(s.issuer)}</span><span class="caption-5 source-date">${escape(s.published)}</span><a class="button-sm inline-link" href="${s.url}" target="_blank" rel="noopener noreferrer">查看原文 <span aria-hidden="true">↗</span></a></article>`;
const noticeHTML=()=>{let s=SOURCES.find(s=>s.id==='siguniang-notice');return `<div class="notice-summary"><h3 class="title-3">先看出行日期与活动范围</h3><p class="body-6">${s.summary}</p><div class="dates caption-1"><span>生效：${s.effective}</span><span>恢复：${s.restore}</span></div><a class="button-sm" target="_blank" rel="noopener noreferrer" href="${s.url}">阅读11月16日公告 ↗</a></div>`};
function contextQuestion(){const name=mountain||'我想去的山';const qs={guide:`请帮我查${name}的官方资料、游览与徒步方式，附来源。`,tickets:`请帮我查${name}的门票价格、优惠和官方预约入口，区分门票、索道与交通车，标明价格适用日期。`,notices:`请帮我查${name}最新的开放公告，说明适用线路、生效日期，以及出行前还需核实的内容。`,certificates:`请帮我查${mountain||'登山'}的登顶证书查询和办理入口，区分景区纪念证书与协会登顶成绩认证。`,news:`请查最近30天${mountain||'国内登山和徒步领域'}的重要消息，附事件日期、发布日期与官方原文。`,professional:`我计划攀登${name}，请查当前开放和组织要求，并整理个人向登山俱乐部提供的材料。`};return qs[service]}
function matches(s){if(!mountain)return true;return s.mountain.includes(mountain)||mountain.includes(s.mountain)||(mountain.includes('大峰')&&s.mountain==='四姑娘山')||(service==='certificates'&&/四川|四姑娘|大峰|二峰|三峰/.test(mountain)&&s.mountain==='四川山峰')}
function render(){
 const current=SERVICES.find(s=>s.id===service);$('#workspace-title').textContent=current.title;$('#mountain').value=mountain;
 $$('.service').forEach(el=>{let active=el.dataset.service===service;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',active)});
 $$('[data-mountain]').forEach(el=>el.classList.toggle('active',el.dataset.mountain===mountain));
 let list=SOURCES.filter(s=>s.type===service&&matches(s));let lead='';
 if(service==='guide'){list=SOURCES.filter(s=>(s.type==='guide'||s.id==='taishan-book'||s.id==='huangshan-book')&&matches(s));lead='<div class="info-block"><h3 class="title-3">先分清这次活动</h3><p class="body-6">景区游览、开放步道徒步和技术攀登各有对应入口。先看景区导览，再核对计划路线的开放公告。</p></div>'}
 if(service==='notices'&&(!mountain||/四姑娘|大峰/.test(mountain)))lead=noticeHTML();
 if(service==='certificates')lead='<div class="info-block"><h3 class="title-3">先看颁发机构</h3><p class="body-6">景区纪念证书找景区，赛事完赛证书找主办方，协会登顶成绩认证找颁发协会。已有证书时，可按证书上的机构名称或二维码进入官网。</p></div>';
 if(service==='professional'){lead='<div class="info-block"><h3 class="title-3">把攀登计划交给合适的组织者</h3><ol class="body-6"><li>确认山峰、路线、日期及当期开放要求。</li><li>联系在当地具备组织条件的登山公司或俱乐部，核对费用、向导、保险和办理清单。</li><li>整理登山经历、紧急联系人及组织者要求的个人资料。</li></ol><p class="body-6">俱乐部经办人可进入工作台，继续填写申请表、检查材料和复核补正。</p><a class="button-sm inline-link" target="_blank" rel="noopener noreferrer" href="'+CONFIG.businessUrl+'">进入俱乐部工作台 ↗</a></div>';if(!mountain||/四姑娘|大峰/.test(mountain))lead+=noticeHTML();}
 if(service==='news')list=list.filter(s=>s.id!=='national-news');
 const unsupported=mountain&&list.length===0;
 $('#lookup-status').textContent=unsupported?`暂未收录“${mountain}”的这类资料，可让助手继续查询。`:`${mountain?mountain+' · ':''}${current.title}，${list.length}份来源资料`;
 const empty=`<div class="empty"><h3 class="title-3">${mountain?'继续查询这座山':'从具体问题开始'}</h3><p class="body-6">${mountain?'首页资料库尚未收录对应条目。可以把山名、路线和想查的事项交给助手。':'告诉助手山名、路线或颁发机构，查找对应的官方入口。'}</p><button class="button-sm" data-ask>去问山行</button></div>`;
 $('#results').innerHTML=lead+(list.length?list.map(sourceHTML).join(''):empty);
 $('#workspace-kicker').textContent=service==='news'?'来源明确的近期消息':service==='certificates'?'按颁发机构查找':'官方资料与办事入口';
}
function setService(id,scroll=false){if(!SERVICES.some(s=>s.id===id))return;service=id;render();if(scroll)$('#workspace-title').scrollIntoView({behavior:'smooth',block:'start'})}
function showChat(question=''){
 if(question){prepared=question;$('#prepared-question').textContent=question;$('#question-guide').hidden=false;$('#chat-panel').classList.add('is-open');document.body.classList.add('chat-open');$('#copy-status').textContent='正在复制';navigator.clipboard.writeText(question).then(()=>{$('#copy-status').textContent='已复制，粘贴到问答页后发送';}).catch(()=>{$('#copy-status').textContent='请手动复制上方问题';});}
 if(CONFIG.chatUrl)window.open(CONFIG.chatUrl,'_blank','noopener,noreferrer');
}
function closeChat(){$('#chat-panel').classList.remove('is-open');document.body.classList.remove('chat-open');$('#mobile-home').focus()}
document.addEventListener('click',e=>{const el=e.target.closest('[data-service],[data-mountain],[data-open-chat],[data-ask],[data-legal],[data-direct-question]');if(!el)return;if(el.dataset.service)setService(el.dataset.service,!el.classList.contains('service'));else if(el.hasAttribute('data-mountain')){mountain=el.dataset.mountain;render()}else if(el.dataset.directQuestion)showChat(el.dataset.directQuestion);else if(el.hasAttribute('data-open-chat'))showChat();else if(el.hasAttribute('data-ask'))showChat(contextQuestion());else showLegal(el.dataset.legal)});
$('#lookup-form').addEventListener('submit',e=>{e.preventDefault();mountain=$('#mountain').value.trim();render()});
$('#ask-context').addEventListener('click',()=>showChat(contextQuestion()));$('#close-chat').addEventListener('click',closeChat);$('#mobile-home').addEventListener('click',closeChat);
$('#copy-question').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(prepared);$('#copy-status').textContent='已复制，粘贴到问答页后发送';}catch{$('#copy-status').textContent='复制未完成，请选中上方问题复制';}});
function dialog(title,html){$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=html;$('#info-dialog').showModal()}
$('#dialog-close').addEventListener('click',()=>$('#info-dialog').close());$('#info-dialog').addEventListener('click',e=>{if(e.target===$('#info-dialog'))$('#info-dialog').close()});
$('#sources-open').addEventListener('click',()=>dialog('来源目录',`<p class="body-6">以下资料核验于${CONFIG.verified}。静态摘要保留发布日，当前价格和开放状态可继续向助手查询。</p>`+SOURCES.map(sourceHTML).join('')));
function showLegal(type){if(type==='privacy')dialog('隐私说明','<p class="body-3">首页不要求注册，不采集身份证、健康报告或证书姓名，也不在本站保存聊天内容。山名查询在当前浏览器中筛选资料。</p><p class="body-3">智能问答由腾讯ADP体验页提供。输入问答的内容会发送至腾讯平台，按其页面说明处理。请使用概括信息，证书核验直接前往颁发机构页面。</p><p class="body-3">官方链接会在新窗口打开，由对应网站提供服务。</p>');else dialog('使用说明','<p class="body-3">山行是电子政务课程项目，提供公开资料导航和智能问答。首页保留资料发布日期与原文，问答用于继续查询具体山峰、路线和日期。</p><p class="body-3">门票由官方渠道预约，证书由颁发机构查询和办理。俱乐部工作台继续服务登山公司及登山俱乐部的材料准备。</p>')}
const FAQ=[['查门票时需要提供什么？','先给山名即可。若要查当期价格、优惠或余票，再补充日期和票种。身份证信息直接在官方预约渠道填写。'],['景区门票包含索道和交通车吗？','按景区票种分别核对。门票、索道、交通车可能分开计价，页面和助手会尽量分别列明。'],['某一条线路关闭，整个景区都不能去吗？','按公告列明的区域、活动和日期判断。例如暂停登山与徒步穿越的公告，需要与普通景区游览分开核对。'],['登顶证书都能在一个网站查询吗？','按颁发机构查。景区纪念证书、赛事完赛证书与协会登顶成绩认证有不同的查询及办理方式。'],['首页消息会自动更新吗？','首页显示已核验的资料快照和核验日期；想查新公告或最近新闻，进入问答发起联网查询。'],['准备去爬雪山，下一步怎么办？','提供山峰、路线和计划日期，先核对开放与组织要求，再联系有当地组织条件的登山公司或俱乐部。个人准备清单可交给助手整理。']];
$('#faq-list').innerHTML=FAQ.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('');
$('#news-list').innerHTML=[SOURCES.find(s=>s.id==='siguniang-notice'),...SOURCES.filter(s=>s.kind)].map(s=>`<article class="news-item"><div class="news-date"><span class="caption-5">11月</span><strong>${s.id==='siguniang-notice'?'16':'09'}</strong></div><div class="news-content"><p class="caption-5">${s.kind||'管理公告'} · ${s.issuer}</p><h3 class="title-3"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a></h3><p class="body-6">${s.event?'事件：'+s.event+'。':''}${s.id==='siguniang-notice'?'自12月1日起暂停四项户外活动，按公告范围安排出行。':s.summary}</p></div></article>`).join('');
render();
if(CONFIG.chatUrl){$('#standalone-chat').href=CONFIG.chatUrl;$('#launch-chat').href=CONFIG.chatUrl;}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#chat-panel').classList.contains('is-open')&&!$('#info-dialog').open)closeChat()});
