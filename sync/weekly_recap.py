#!/usr/bin/env python3
"""Weekly recap for Shantell's Closet from posh_feed.json. Writes recap.json + recap.html here. Does NOT send anything."""
import json,os,datetime,html
HERE=os.environ.get('STATE_DIR',os.path.dirname(os.path.abspath(__file__)))
f=json.load(open(os.path.join(os.environ.get('SITE_DIR','/workspace/deploy/shantells-closet'),'posh_feed.json')))
today=datetime.date.today();start=(today-datetime.timedelta(days=7)).isoformat()
sold=sorted([dict(title=s['title'],price=s.get('sold_price_if_available') or s['price'],date=s['sold_date_if_available'],url=s['url']) for s in f['sold'] if (s.get('sold_date_if_available') or '')>=start],key=lambda x:x['date'],reverse=True)
new=[dict(title=a['title'],price=a['price'],date=a['date_listed'],url=a['url']) for a in f['available'] if a['date_listed']>=start]
def age(d):
    try: return (today-datetime.date.fromisoformat(d)).days
    except: return 0
stale=sorted([dict(title=a['title'],price=a['price'],days_listed=age(a['date_listed']),likes=a.get('likes',0),url=a['url']) for a in f['available'] if age(a['date_listed'])>=30 and not a.get('likes')],key=lambda x:-x['days_listed'])
R=dict(period=dict(start=start,end=today.isoformat()),feed_generated_at=f['generated_at'],
 counts=dict(sold=len(sold),new_listings=len(new),available=len(f['available']),stale_total=len(stale)),sold_total=round(sum(x['price'] for x in sold),2),
 sold=sold,new_listings=new,top_stale=stale[:10],note='Sold prices are Poshmark list prices (actual sale price is not public).')
json.dump(R,open(os.path.join(HERE,'recap.json'),'w'),indent=1,ensure_ascii=False)
e=html.escape
def rows(L,cols): return ''.join('<tr>'+''.join(f'<td>{e(str(x[c]))}</td>' for c in cols)+'</tr>' for x in L) or f'<tr><td colspan={len(cols)}>None</td></tr>'
H=f"""<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Shantell's Closet weekly recap</title>
<style>body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f2fc;color:#2a1636;margin:0;padding:0 14px 30px}}header{{background:linear-gradient(135deg,#2c0d3e,#4e1a6a 45%,#7b3fa8);color:#fff;margin:0 -14px 14px;padding:22px 18px;border-radius:0 0 24px 24px}}h1{{font-family:Georgia,serif;margin:0}}h2{{color:#5a2275;font-family:Georgia,serif}}
.st{{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}}.st div{{background:#fff;border-radius:14px;padding:12px;border:1px solid #e2d3f5}}.st b{{display:block;font-size:22px;color:#5a2275}}table{{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;font-size:14px}}td,th{{padding:6px;border-bottom:1px solid #efe6fa;text-align:left}}th{{color:#5a2275}}</style>
<header><div style="color:#f3dfae;font-size:11px;letter-spacing:.2em">✦ WEEKLY RECAP</div><h1>Shantell's Closet</h1><div>{start} to {today}</div></header>
<div class=st><div><b>{len(sold)}</b>sold</div><div><b>${R['sold_total']:.2f}</b>sold total (list prices)</div><div><b>{len(new)}</b>new listings</div><div><b>{len(stale)}</b>need a refresh</div></div>
<h2>Sold this week</h2><table><tr><th>Item</th><th>Price</th><th>Date</th></tr>{rows(sold,['title','price','date'])}</table>
<h2>Needs a refresh (30+ days, 0 likes)</h2><p>Tips: drop the price 10%, try a new cover photo, or share it to a party.</p><table><tr><th>Item</th><th>Price</th><th>Days</th></tr>{rows(stale[:10],['title','price','days_listed'])}</table>
<h2>New listings</h2><table><tr><th>Item</th><th>Price</th><th>Listed</th></tr>{rows(new,['title','price','date'])}</table><p style="color:#6b5a78;font-size:12px">{e(R['note'])}</p>"""
open(os.path.join(HERE,'recap.html'),'w').write(H)
print(json.dumps(R['counts']),R['sold_total'])
