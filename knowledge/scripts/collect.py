#!/usr/bin/env python3
"""Collect public official sources. Never uploads or modifies Tencent applications."""
import argparse
import concurrent.futures
import datetime as dt
import hashlib
import json
import re
import threading
import time
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup
from trafilatura import extract

ROOT = Path(__file__).resolve().parents[1]
DAY = dt.datetime.now().astimezone().date().isoformat()
NOW = dt.datetime.now().astimezone().isoformat(timespec='seconds')
UA = 'ShanxingCourseResearch/1.0 (public official mountain information; low-rate collection)'
USEFUL = re.compile(r'门票|票务|预约|购票|游览|游玩|导览|登山|徒步|路线|线路|概况|简介|交通|开放|关闭|封闭|恢复|运营|公告|游客|证书|锦标赛|挑战赛|户外|天游|一线天|九曲|大红袍|灵峰|灵岩|大龙湫')
EXCLUDE = re.compile(r'党建|党工委|党组|党支部|全会|巡视|干部|意识形态|招聘|招标|采购|征集|比选|成交|谈判|专项检查|预算|决算|财务|政府信息公开|工程施工|农产品|美食|酒店|住宿|投诉|意见反馈|隐私|法律声明|关于我们|联系我们|招商|图片|视频|名宿|民宿|征求意见')
BAD = re.compile(r'访问验证|人机验证|访问过于频繁|Access Denied|Just a moment|页面不存在|404 Not Found|安全验证|网站维护中', re.I)
locks = {}
REFRESH = False

def canonical(url):
    p = urlsplit(url)
    if p.scheme not in ('http', 'https'):
        raise ValueError('unsupported URL scheme')
    return urlunsplit((p.scheme, p.netloc.lower(), p.path or '/', p.query, ''))

def host_allowed(url, site):
    return urlsplit(url).hostname in site['hosts']

def get_page(url, site, cache=True):
    if not host_allowed(url, site):
        raise ValueError('outside approved hosts')
    key = hashlib.sha256(url.encode()).hexdigest()[:20]
    raw = ROOT / 'raw' / f'{key}.html'
    info = ROOT / 'raw' / f'{key}.json'
    if cache and not REFRESH and raw.exists() and info.exists():
        meta = json.loads(info.read_text())
        return raw.read_text(), meta
    original = url
    for _ in range(5):
        if not host_allowed(url, site):
            raise ValueError('redirect outside approved hosts')
        with locks.setdefault(urlsplit(url).hostname, threading.Lock()):
            r = requests.get(url, headers={'User-Agent': UA}, timeout=(8, 18), allow_redirects=False)
            time.sleep(.35)
        if r.status_code in (301, 302, 303, 307, 308):
            url = canonical(urljoin(url, r.headers['Location']))
            continue
        r.raise_for_status()
        if 'text/html' not in r.headers.get('Content-Type', '') and not r.content.lstrip().startswith(b'<'):
            raise ValueError('not an HTML page')
        declared = re.search(br'<meta[^>]+charset=["\s]*([\w-]+)', r.content[:10000], re.I)
        encoding = declared.group(1).decode() if declared else r.apparent_encoding or 'utf-8'
        html = r.content.decode(encoding, errors='replace')
        if BAD.search(BeautifulSoup(html, 'html.parser').get_text(' ', strip=True)[:1800]):
            raise ValueError('verification/error page')
        meta = {'url': original, 'final_url': url, 'http_status': r.status_code, 'fetched_at': NOW,
                'bytes': len(r.content), 'raw_sha256': hashlib.sha256(r.content).hexdigest()}
        raw.write_text(html)
        info.write_text(json.dumps(meta, ensure_ascii=False, indent=2))
        return html, meta
    raise ValueError('too many redirects')

def parse_date(soup, url, text):
    time_tag=soup.select_one('time[itemprop="datePublished"][datetime],time[datetime]')
    if time_tag:
        m=re.search(r'(20\d{2})-(\d{2})-(\d{2})',time_tag['datetime'])
        if m:return f'{m[1]}-{m[2]}-{m[3]}','time[datetime]'
    for key in ('ArticlePubDate', 'PubDate', 'publishdate', 'pubdate', 'date', 'DC.date.issued', 'article:published_time'):
        tag = soup.find('meta', attrs={'name': re.compile('^'+re.escape(key)+'$', re.I)}) or soup.find('meta', attrs={'property': key})
        if tag and tag.get('content'):
            m = re.search(r'(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})', tag['content'])
            if m:
                return '-'.join([m[1], m[2].zfill(2), m[3].zfill(2)]), 'meta:'+key
    m = re.search(r'(?:发布时间|发布日期|签发时间|发布时间：|时间：)\s*[:：]?\s*(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})', soup.get_text(' ', strip=True))
    if not m:
        h = soup.find('h1') or soup.find('h2')
        near = h.parent.get_text(' ', strip=True)[:1000] if h else text[:250]
        m = re.search(r'(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})', near)
    if m:
        return '-'.join([m[1], m[2].zfill(2), m[3].zfill(2)]), 'visible publication area'
    return '', 'not found'

def classify(title, site_id):
    if site_id == 'national': return 'news'
    if re.search(r'票|预约|优惠', title): return 'tickets'
    if re.search(r'开放|关闭|封闭|恢复|公告|通知|运营|停运|暂停', title): return 'notices'
    if re.search(r'证书|认证', title): return 'certificates'
    return 'guide'

def links_from(html, url, site):
    soup = BeautifulSoup(html, 'html.parser')
    out = {}
    for a in soup.select('a[href]'):
        title = a.get('title') or a.get_text(' ', strip=True)
        if not title or not USEFUL.search(title) or EXCLUDE.search(title): continue
        try: target = canonical(urljoin(url, a['href']))
        except ValueError: continue
        if not host_allowed(target, site) or re.search(r'\.(pdf|docx?|xlsx?|zip|jpg|png|mp4)(\?|$)|/en/|lang=en|javascript:', target, re.I): continue
        score = sum(bool(re.search(p, title)) for p in ('门票|票务|预约|购票','开放|关闭|封闭|恢复|运营','导览|游览|路线|概况|简介','公告|通知'))
        if len(title) > 8: score += 2
        # Prefer stable visitor pages and full notices over lists.
        if re.search(r'/info/\d|detial/\d|nid-|/c\d+|/art/|\.html$', target): score += 1
        out[target] = {'url':target, 'anchor_title':title[:150], 'score':score}
    return list(out.values())

def parse_page(url, site, anchor_title=''):
    html, meta = get_page(url, site)
    soup = BeautifulSoup(html, 'html.parser')
    h = soup.select_one('.details .title') or soup.select_one('h2.elementor-heading-title') or soup.find('h1')
    article_meta = soup.find('meta', attrs={'name':'ArticleTitle'})
    title = article_meta.get('content','') if article_meta else ''
    if not title:
        title = h.get_text(' ', strip=True) if h and len(h.get_text(strip=True)) > 3 else (soup.title.get_text(' ', strip=True) if soup.title else anchor_title)
    if title and re.search(r'Powered by|Jspxcms|^雁荡山$|^武夷山景区$|^天柱山风景名胜区', title) and anchor_title:
        title = anchor_title
    title = re.split(r'\s+-\s+Powered|[-_]恒山风景|,庐山市人民政府', title)[0].strip()[:160]
    if EXCLUDE.search(title): raise ValueError('not relevant to visitor service')
    for el in soup.select('script,style,noscript,header,footer,nav,form,.header,.footer,.nav,.menu,.breadcrumb'):
        el.decompose()
    text = extract(html, output_format='txt', include_links=False, include_tables=True, favor_precision=True, no_fallback=False) or ''
    # Government editor containers preserve complete numeric tables and article bodies.
    for selector in ('#zoom','.TRS_Editor','#UCAP-CONTENT','.details .content','.main-content.elementor-widget-text-editor','.article-content','.article_con','.articleContent','.content-article','.news_content','.news-content'):
        el = soup.select_one(selector)
        if el and len(el.get_text(strip=True)) > 140:
            text = el.get_text('\n', strip=True)
            break
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    if site['id']=='hengshan':text=re.split(r'关键词[：:]|联系我们',text)[0].strip()
    if len(text) < 100 or len(re.findall(r'[\u4e00-\u9fff]', text)) < 45:
        raise ValueError('insufficient Chinese article text')
    if BAD.search(text[:500]): raise ValueError('error page body')
    if '联系我们' in text[:100] and '旅游咨询' in text[:150]: raise ValueError('only footer/contact text; article likely image-only')
    published, method = parse_date(BeautifulSoup(html, 'html.parser'), meta['final_url'], text)
    if published and published > DAY: raise ValueError('publication date is in the future')
    ident = site['id']+'-'+hashlib.sha256(url.encode()).hexdigest()[:10]
    return {**meta, 'id':ident, 'site_id':site['id'], 'mountain':site['mountain'], 'aliases':site['aliases'],
            'issuer':site['issuer'], 'title':title or anchor_title, 'type':classify(title or anchor_title, site['id']),
            'published':published, 'date_evidence':method, 'text':text, 'chars':len(text),
            'content_sha256':hashlib.sha256(re.sub(r'\s+','',text).encode()).hexdigest(),
            'authority_url':site['authority'], 'authority_basis':site['authority_basis'], 'status':'collected'}

def collect_site(site):
    errors, candidates, pages, seen = [], {}, [], set()
    for url in site['seeds']:
        try:
            html, meta = get_page(url, site)
            candidates[url]={'url':url,'anchor_title':'','score':20}
            for c in links_from(html, meta['final_url'], site):
                candidates[c['url']] = c
        except Exception as e: errors.append({'url':url,'reason':str(e)[:220]})
    # Read a small number of relevant index pages to discover full articles.
    indexes = [c for c in candidates.values() if c['score'] < 4 and re.search(r'公告|指南|票务|景区概况', c['anchor_title'])][:2]
    for c in indexes:
        try:
            html, meta = get_page(c['url'], site)
            for child in links_from(html, meta['final_url'], site): candidates.setdefault(child['url'], child)
        except Exception as e: errors.append({'url':c['url'],'reason':str(e)[:220]})
    choices=sorted(candidates.values(), key=lambda x:-x['score'])[:site['limit']+4]
    for c in choices:
        if len(pages)>=site['limit']:break
        try:
            p=parse_page(c['url'],site,c['anchor_title'])
            if p['content_sha256'] in seen: raise ValueError('duplicate article body')
            seen.add(p['content_sha256']);pages.append(p)
        except Exception as e: errors.append({'url':c['url'],'reason':str(e)[:220]})
    print(json.dumps({'site':site['id'],'collected':len(pages),'failed':len(errors)},ensure_ascii=False),flush=True)
    return pages, errors, list(candidates.values())

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--sites',nargs='*')
    parser.add_argument('--reparse',action='store_true',help='Re-extract already downloaded pages without discovering new URLs')
    parser.add_argument('--refresh',action='store_true',help='Fetch current source pages instead of reusing local snapshots')
    args=parser.parse_args()
    global REFRESH
    REFRESH=args.refresh
    for name in ('raw','outputs','docs','evidence'): (ROOT/name).mkdir(exist_ok=True)
    sites=json.loads((ROOT/'sites.json').read_text())
    if args.reparse:
        mapping={s['id']:s for s in sites}
        pages=[];errors=[]
        for old in json.loads((ROOT/'outputs/collected.json').read_text()):
            try: pages.append(parse_page(old['url'],mapping[old['site_id']],old['title']))
            except Exception as e:errors.append({'id':old['id'],'url':old['url'],'reason':str(e)[:220]})
        (ROOT/'outputs/collected.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2))
        (ROOT/'outputs/extraction-rejections.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2))
        print(json.dumps({'reparsed':len(pages),'rejected':len(errors)}));return
    if args.sites: sites=[s for s in sites if s['id'] in args.sites]
    pages, errors, discovered=[],[],[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for ps, es, ds in pool.map(collect_site,sites): pages+=ps;errors+=es;discovered+=ds
    if args.sites and (ROOT/'outputs/collected.json').exists():
        previous=json.loads((ROOT/'outputs/collected.json').read_text())
        pages=[p for p in previous if p['site_id'] not in args.sites]+pages
    (ROOT/'outputs/collected.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2))
    (ROOT/'outputs/collection-errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2))
    history_path=ROOT/'outputs/collection-error-history.json'
    history=json.loads(history_path.read_text()) if history_path.exists() else []
    history.extend({**e,'observed_at':NOW} for e in errors)
    history_path.write_text(json.dumps(history,ensure_ascii=False,indent=2))
    (ROOT/'outputs/discovered.json').write_text(json.dumps(discovered,ensure_ascii=False,indent=2))
    print(json.dumps({'total':len(pages),'errors':len(errors)},ensure_ascii=False))

if __name__=='__main__': main()
