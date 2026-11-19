import {CONFIG,SOURCES,SERVICES,MOUNTAINS} from './data.js?v=knowledge-20261118';
import {selectSources,publishedDate} from './catalog.js?v=knowledge-20261118';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={mountains:'M2 20 9 5l6 11 3-6 5 10H2Zm4-9 3 3 3-3',ticket:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Zm12 0v14',bell:'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4M12 2v2',certificate:'M4 3h16v13H4V3Zm4 5h8m-8 4h5m1 4v6l3-2 3 2v-6',newspaper:'M3 4h15v16H5a2 2 0 0 1-2-2V4Zm15 4h3v10a2 2 0 0 1-2 2M7 8h7m-7 4h7m-7 4h4',compass:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm5-15-3 7-7 3 3-7 7-3Z'};
let service='guide',mountain='',prepared='',visibleCount=6;
$('#business-link').href=CONFIG.businessUrl;
$('#verified-date').textContent=`资料核验 ${CONFIG.verified}`;
$('#lookup-help').textContent=`${MOUNTAINS.length}处山岳与景区，${SOURCES.length}份资料`;
$('#mountain-options').innerHTML=MOUNTAINS.map(name=>`<option value="${escape(name)}"></option>`).join('');
$('#mountain-pills').innerHTML=['泰山','恒山','庐山','天柱山','梵净山','四姑娘山'].map(name=>`<button class="button-sm pill" data-mountain="${escape(name)}">${escape(name)}</button>`).join('')+'<button class="button-sm pill" data-mountain="" id="all-mountains">全部资料</button>';
$('#services').innerHTML=SERVICES.map(s=>`<button class="service ${s.color} ${s.id===service?'selected':''}" data-service="${s.id}" aria-pressed="${s.id===service}"><svg class="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[s.icon]}"/></svg><span class="title-3">${s.title}</span><span class="caption-5">${s.desc}</span><span class="small-arrow" aria-hidden="true">↗</span></button>`).join('');
const sourceHTML=s=>`<article class="source-card"><div class="source-top"><h3 class="title-3">${escape(s.title)}</h3><span class="badge">${escape(s.mountain)}</span></div><p class="body-6">${escape(s.summary)}</p><span class="caption-5">${escape(s.issuer)}</span><span class="caption-5 source-date">${escape(s.published)}</span><a class="button-sm inline-link" href="${s.url}" target="_blank" rel="noopener noreferrer">查看原文 <span aria-hidden="true">↗</span></a></article>`;
const noticeHTML=()=>{let s=SOURCES.find(s=>s.id==='siguniang-notice');return `<div class="notice-summary"><h3 class="title-3">先看出行日期与活动范围</h3><p class="body-6">${s.noticeLead}</p><div class="dates caption-1"><span>生效：${s.effective}</span><span>恢复：${s.restore}</span></div><a class="button-sm" target="_blank" rel="noopener noreferrer" href="${s.url}">阅读11月16日公告 ↗</a></div>`};
function contextQuestion(){const name=mountain||'我想去的山';const qs={guide:`请帮我查${name}的官方资料、游览与徒步方式，附来源。`,tickets:`请帮我查${name}的门票价格、优惠和官方预约入口，区分门票、索道与交通车，标明价格适用日期。`,notices:`请帮我查${name}最新的开放公告，说明适用线路、生效日期，以及出行前还需核实的内容。`,certificates:`请帮我查${mountain||'登山'}的登顶证书查询和办理入口，区分景区纪念证书与协会登顶成绩认证。`,news:`请查最近30天${mountain||'国内登山和徒步领域'}的重要消息，附事件日期、发布日期与官方原文。`,professional:`我计划攀登${name}，请查当前开放和组织要求，并整理个人向登山俱乐部提供的材料。`};return qs[service]}
function render(){
 const current=SERVICES.find(s=>s.id===service);$('#workspace-title').textContent=current.title;$('#mountain').value=mountain;
 $$('.service').forEach(el=>{let active=el.dataset.service===service;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',active)});
 $$('[data-mountain]').forEach(el=>el.classList.toggle('active',el.dataset.mountain===mountain));
 let list=selectSources(SOURCES,service,mountain,CONFIG.verified);let lead='';
 if(service==='notices'&&(!mountain||/四姑娘|大峰/.test(mountain)))lead=noticeHTML();
 if(service==='certificates')lead='<div class="info-block"><h3 class="title-3">先看颁发机构</h3><p class="body-6">景区证书找景区，赛事证书找主办方，登顶认证找颁发协会。</p></div>';
 if(service==='professional'){lead='<div class="info-block"><h3 class="title-3">准备专业攀登</h3><ol class="body-6"><li>确认山峰、路线、日期和开放情况。</li><li>联系登山公司或俱乐部，核对向导、保险和费用。</li><li>准备登山经历、紧急联系人等材料。</li></ol><p class="body-6">俱乐部可在工作台准备申请材料。</p><a class="button-sm inline-link" target="_blank" rel="noopener noreferrer" href="'+CONFIG.businessUrl+'">进入俱乐部工作台 ↗</a></div>';if(!mountain||/四姑娘|大峰/.test(mountain))lead+=noticeHTML();}
 const unsupported=mountain&&list.length===0;
 $('#lookup-status').textContent=unsupported?`未找到“${mountain}”的${service==='news'?'近30天消息':current.title}。`:`${mountain?mountain+' · ':''}${service==='news'?'近30天消息':current.title}，${list.length}份来源资料`;
 const empty=`<div class="empty"><h3 class="title-3">${mountain?'继续查询这座山':'从具体问题开始'}</h3><p class="body-6">${mountain?'告诉助手山名和查询事项。':'告诉助手山名或颁发机构。'}</p><button class="button-sm" data-ask>去问山行</button></div>`;
 $('#results').innerHTML=lead+(list.length?list.slice(0,visibleCount).map(sourceHTML).join(''):empty)+(list.length>visibleCount?`<button class="button-sm pill" data-more>显示更多（${list.length-visibleCount}）</button>`:'');
 $('#workspace-kicker').textContent=service==='news'?'来源明确的近期消息':service==='certificates'?'按颁发机构查找':'官方资料与办事入口';
}
function setService(id,scroll=true){if(!SERVICES.some(s=>s.id===id))return;service=id;visibleCount=6;render();if(scroll){const heading=$('#workspace-title');heading.setAttribute('tabindex','-1');$('.workspace').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});heading.focus({preventScroll:true});}}
function showChat(question=''){
 if(question){prepared=question;$('#prepared-question').textContent=question;$('#question-guide').hidden=false;$('#chat-panel').classList.add('is-open');document.body.classList.add('chat-open');$('#copy-status').textContent='正在复制';(navigator.clipboard?.writeText?navigator.clipboard.writeText(question):Promise.reject(new Error('clipboard unavailable'))).then(()=>{$('#copy-status').textContent='已复制，粘贴到问答页后发送';}).catch(()=>{$('#copy-status').textContent='请手动复制上方问题';});}
 if(CONFIG.chatUrl)window.open(CONFIG.chatUrl,'_blank','noopener,noreferrer');
}
function closeChat(){$('#chat-panel').classList.remove('is-open');document.body.classList.remove('chat-open');$('#mobile-home').focus()}
document.addEventListener('click',e=>{const el=e.target.closest('[data-service],[data-mountain],[data-open-chat],[data-ask],[data-legal],[data-direct-question],[data-more]');if(!el)return;if(el.hasAttribute('data-more')){visibleCount+=6;render()}else if(el.dataset.service)setService(el.dataset.service,true);else if(el.hasAttribute('data-mountain')){mountain=el.dataset.mountain;visibleCount=6;render()}else if(el.dataset.directQuestion)showChat(el.dataset.directQuestion);else if(el.hasAttribute('data-open-chat'))showChat();else if(el.hasAttribute('data-ask'))showChat(contextQuestion());else showLegal(el.dataset.legal)});
$('#lookup-form').addEventListener('submit',e=>{e.preventDefault();mountain=$('#mountain').value.trim();visibleCount=6;render()});
$('#ask-context').addEventListener('click',()=>showChat(contextQuestion()));$('#close-chat').addEventListener('click',closeChat);$('#mobile-home').addEventListener('click',closeChat);
$('#copy-question').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(prepared);$('#copy-status').textContent='已复制，粘贴到问答页后发送';}catch{$('#copy-status').textContent='复制未完成，请选中上方问题复制';}});
function dialog(title,html){$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=html;$('#info-dialog').showModal()}
$('#dialog-close').addEventListener('click',()=>$('#info-dialog').close());$('#info-dialog').addEventListener('click',e=>{if(e.target===$('#info-dialog'))$('#info-dialog').close()});
$('#sources-open').addEventListener('click',()=>dialog('来源目录',`<p class="body-6">${SOURCES.length}份资料，核验于${CONFIG.verified}。</p>`+SOURCES.map(sourceHTML).join('')));
function showLegal(type){if(type==='privacy')dialog('隐私说明','<p class="body-3">首页不要求注册，不采集身份证、健康报告或证书姓名，也不在本站保存聊天内容。山名查询在当前浏览器中筛选资料。</p><p class="body-3">智能问答由腾讯ADP体验页提供。输入问答的内容会发送至腾讯平台，按其页面说明处理。请使用概括信息，证书核验直接前往颁发机构页面。</p><p class="body-3">官方链接会在新窗口打开，由对应网站提供服务。</p>');else dialog('使用说明','<p class="body-3">山行是电子政务课程项目，提供公开资料导航和智能问答。首页保留资料发布日期与原文，问答用于继续查询具体山峰、路线和日期。</p><p class="body-3">门票由官方渠道预约，证书由颁发机构查询和办理。俱乐部工作台继续服务登山公司及登山俱乐部的材料准备。</p>')}
const FAQ=[['查门票时需要提供什么？','提供山名、日期和票种。证件信息在官方渠道填写。'],['景区门票包含索道和交通车吗？','各景区不同。请分别核对门票、索道和交通车价格。'],['某一条线路关闭，整个景区都不能去吗？','按公告列明的区域、活动和日期判断。'],['登顶证书都能在一个网站查询吗？','按颁发机构查询，景区、赛事和协会入口各不相同。'],['首页消息会自动更新吗？','首页展示已核验资料；最新消息可在问答中查询。'],['准备去爬雪山，下一步怎么办？','先核对山峰、路线和开放要求，再联系登山公司或俱乐部。']];
$('#faq-list').innerHTML=FAQ.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('');
const recent=[...selectSources(SOURCES,'news','',CONFIG.verified),...SOURCES.filter(s=>['siguniang-notice','hengshan-54dec60876'].includes(s.id))].sort((a,b)=>publishedDate(b.published).localeCompare(publishedDate(a.published))).slice(0,3);
$('#news-list').innerHTML=recent.map(s=>{const date=publishedDate(s.published);return `<article class="news-item"><div class="news-date"><span class="caption-5">${Number(date.slice(5,7))}月</span><strong>${date.slice(8,10)}</strong></div><div class="news-content"><p class="caption-5">${escape(s.kind||'管理公告')} · ${escape(s.issuer)}</p><h3 class="title-3"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a></h3><p class="body-6">${s.event?'事件：'+escape(s.event)+'。':''}${escape(s.summary)}</p></div></article>`}).join('');
render();
if(CONFIG.chatUrl){$('#standalone-chat').href=CONFIG.chatUrl;$('#launch-chat').href=CONFIG.chatUrl;}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#chat-panel').classList.contains('is-open')&&!$('#info-dialog').open)closeChat()});
