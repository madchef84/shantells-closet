#!/usr/bin/env python3
"""Build posh_feed.json from Shantell's PUBLIC Poshmark closet (no login) and redeploy the site with surge.
Usage: python3 build_feed.py [--no-deploy]"""
import json,subprocess,time,sys,os,datetime
SITE=os.environ.get('SITE_DIR','/workspace/deploy/shantells-closet')
DOMAIN='shantells-closet.surge.sh'
CLOSET='https://poshmark.com/closet/shannynicole'
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36'
T='window.__INITIAL_STATE__='
CM={'nwt':'NWT','nwot':'NWOT','boutique':'Boutique','like_new':'Like new','good':'Good','fair':'Fair','poor':'Poor','not_nwt':'Used','ug':'Used - Good','uln':'Used - Like new','uf':'Used - Fair','ue':'Used - Excellent'}
def get(url):
    for a in range(3):
        h=subprocess.run(['curl','-s','--max-time','40','-A',UA,url],capture_output=True,text=True).stdout
        if T in h: return json.JSONDecoder().raw_decode(h[h.index(T)+len(T):])[0]['$_closet']['listingsPostData']
        time.sleep(3)
    raise SystemExit('Could not read closet page: '+url)
def crawl(av):
    items=[];seen=set();mx=None;p=0
    while True:
        L=get(f'{CLOSET}?availability={av}'+(f'&max_id={mx}' if mx else ''));p+=1
        new=[x for x in L['data'] if x['id'] not in seen]
        for x in new: seen.add(x['id']);items.append(x)
        mx=(L.get('more') or {}).get('next_max_id')
        print(av,'page',p,'total',len(items),flush=True)
        if not new or not mx: break
        time.sleep(1)
    return items
def price(x): return float((x.get('price_amount') or {}).get('val') or x.get('price') or 0)
def url(x): return f"https://poshmark.com/listing/{x['id']}"
av=crawl('available'); so=crawl('sold_out')
cut=(datetime.date.today()-datetime.timedelta(days=730)).isoformat()
A=[dict(url=url(x),title=x.get('title',''),price=price(x),size=(x.get('size_obj') or {}).get('display') or x.get('size') or '',
   color=', '.join(c['name'] for c in x.get('colors') or []),brand=x.get('brand') or '',photo=x.get('picture_url') or ((x.get('cover_shot') or {}).get('url') or ''),
   category=' > '.join(filter(None,[(x.get('department') or {}).get('display'),(x.get('category_v2') or {}).get('display') or x.get('category')])),
   condition=CM.get(x.get('condition'),x.get('condition') or ''),date_listed=(x.get('first_published_at') or x.get('created_at') or '')[:10],likes=int(x.get('like_count') or 0)) for x in av]
S=[]
for x in so:
    sd=((x.get('inventory') or {}).get('status_changed_at') or '')[:10] or None
    if max((x.get('first_published_at') or x.get('created_at') or '')[:10], sd or '') < cut: continue  # keep if listed OR sold in last ~2 years
    S.append(dict(url=url(x),title=x.get('title',''),price=price(x),sold_price_if_available=None,sold_date_if_available=sd,photo=x.get('picture_url') or ((x.get('cover_shot') or {}).get('url') or '')))
feed=dict(generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),closet=CLOSET,
   counts=dict(available=len(A),sold=len(S),sold_total_on_closet=len(so)),available=A,sold=S)
# ---- new-sales detection (state: seen_sold_ids.json; output: new_sales.json) ----
HERE=os.environ.get('STATE_DIR',os.path.dirname(os.path.abspath(__file__)))
SEEN=os.path.join(HERE,'seen_sold_ids.json');NEW=os.path.join(HERE,'new_sales.json')
cur={x['id']:x for x in so}  # all sold ids on the closet (not just the 2-year slice)
if os.path.exists(SEEN):
    seen=set(json.load(open(SEEN)));newl=[dict(title=x.get('title',''),url=url(x),price=price(x),
        sold_date=((x.get('inventory') or {}).get('status_changed_at') or '')[:10] or None) for i,x in cur.items() if i not in seen]
else:
    seen=set();newl=[]  # first run: treat everything as already seen
print('new sales since last run:',len(newl))
json.dump(newl,open(NEW+'.tmp','w'),indent=1,ensure_ascii=False);os.replace(NEW+'.tmp',NEW)
json.dump(sorted(seen|set(cur)),open(SEEN+'.tmp','w'));os.replace(SEEN+'.tmp',SEEN)
tmp=os.path.join(SITE,'posh_feed.json.tmp')
json.dump(feed,open(tmp,'w'),separators=(',',':'),ensure_ascii=False); os.replace(tmp,os.path.join(SITE,'posh_feed.json'))
print('feed:',feed['counts'],os.path.getsize(os.path.join(SITE,'posh_feed.json')),'bytes')
if '--no-deploy' not in sys.argv:
    r=subprocess.run(['npx','--yes','surge',SITE,DOMAIN],cwd=SITE)
    sys.exit(r.returncode)
