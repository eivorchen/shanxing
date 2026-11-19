import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {CONFIG,SOURCES,MOUNTAINS} from '../../data.js';
import {selectSources,publishedDate} from '../../catalog.js';
const find=(service,name)=>selectSources(SOURCES,service,name,CONFIG.verified);

test('来源目录 ID 与网址唯一，必要信息完整',()=>{
  assert.equal(new Set(SOURCES.map(s=>s.id)).size,SOURCES.length);
  assert.equal(new Set(SOURCES.map(s=>s.url)).size,SOURCES.length);
  for(const source of SOURCES){for(const key of ['id','mountain','title','issuer','published','url','summary'])assert.ok(source[key],`${source.id}: ${key}`);assert.equal(new URL(source.url).protocol,'https:');}
  assert.equal(CONFIG.sourceCount,SOURCES.length);assert.equal(CONFIG.mountainCount,MOUNTAINS.length);
});
test('新增正文都来自白名单站点，并通过对应正文哈希复核',async()=>{
  const {documents}=JSON.parse(await fs.readFile(new URL('../import-ledger.json',import.meta.url),'utf8'));
  const reviews=JSON.parse(await fs.readFile(new URL('../review.json',import.meta.url),'utf8'));
  const sites=JSON.parse(await fs.readFile(new URL('../sites.json',import.meta.url),'utf8'));
  for(const source of documents){assert.equal(source.http_status,200);assert.ok(sites.find(s=>s.id===source.site_id).hosts.includes(new URL(source.url).hostname));assert.equal(source.content_sha256,reviews[source.id].reviewed_content_sha256);assert.equal(source.status,'imported');}
  assert.equal(documents.length,40);
});
test('恒山与衡山分开检索，新增山岳有对应原文',()=>{
  const result=find('tickets','恒山');assert.ok(result.length>0);assert.ok(result.every(s=>s.mountain==='恒山'));
  for(const name of ['峨眉山','青城山','香山'])assert.ok(find('tickets',name).length>0,name);
  for(const name of ['庐山','雁荡山','梵净山','嵩山'])assert.ok(find('guide',name).length>0,name);
});
test('景点别名收窄结果，大峰保留既有专业攀登资料',()=>{
  const result=find('guide','三叠泉');assert.ok(result.some(s=>s.title.includes('三叠泉')));assert.ok(result.every(s=>!s.title.includes('观音桥')));
  assert.ok(find('professional','大峰').some(s=>s.id==='siguniang-climb'));
});
test('徒步打卡与协会登顶证书保留不同来源',()=>{
  assert.ok(find('certificates','长坪沟').some(s=>s.id==='siguniang-2c2c3cdecb'));
  assert.ok(find('certificates','四川').some(s=>s.id==='sichuan-cert'));
});
test('新闻按发布日期保留近30天，未来赛事仍标为计划',()=>{
  const news=find('news','');assert.ok(news.length>0);assert.ok(news.every(s=>publishedDate(s.published)>='2026-10-19'));
  assert.ok(!news.some(s=>s.id==='taishan-d00919c3e8'));
  assert.ok(news.find(s=>s.id==='national-d982b7fe84').summary.includes('计划'));
});
test('未收录山名返回空结果，默认导览先展示不同山岳',()=>{
  assert.deepEqual(find('guide','乞力马扎罗'),[]);
  const first=find('guide','').slice(0,6);assert.equal(new Set(first.map(s=>s.mountain)).size,first.length);
});
