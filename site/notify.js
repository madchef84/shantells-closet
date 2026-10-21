/* Shantell's Closet - notifications + sounds (v1.4.0). Self-contained. */
(function(){
var LS={seen:'sc_sold_seen_v1',hist:'sc_notif_hist_v1',gen:'sc_gen_seen_v1',set:'sc_sound_settings_v1'};
function jget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var S=Object.assign({on:true,vol:0.7,sale:'chaching',other:'chime',sys:false},jget(LS.set,{}));
function saveS(){jset(LS.set,S)}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
// ---------- sounds (Web Audio, generated, no files) ----------
var AC=null,unlocked=false;
function ctx(){if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C()}return AC}
function unlock(){var c=ctx();if(!c)return;if(c.state==='suspended')c.resume();var b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);unlocked=true}
['pointerdown','touchend','keydown','click'].forEach(function(ev){document.addEventListener(ev,unlock,{capture:true,passive:true})});
function tone(c,out,f,t0,dur,type,peak,f2){var o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);
 g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(peak||0.5,t0+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);o.connect(g);g.connect(out);o.start(t0);o.stop(t0+dur+0.05)}
var SOUNDS={
 chaching:{name:'Cha-ching 💰',p:function(c,o,t){tone(c,o,1318,t,0.08,'square',0.25);tone(c,o,1760,t+0.08,0.08,'square',0.25);
   var n=c.createBufferSource(),b=c.createBuffer(1,c.sampleRate*0.25,c.sampleRate),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
   var hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=5000;var g=c.createGain();g.gain.value=0.3;n.buffer=b;n.connect(hp);hp.connect(g);g.connect(o);n.start(t+0.18);
   tone(c,o,2637,t+0.18,0.6,'triangle',0.35);tone(c,o,3520,t+0.2,0.5,'sine',0.2)}},
 chime:{name:'Chime ✨',p:function(c,o,t){[659,784,988,1319].forEach(function(f,i){tone(c,o,f,t+i*0.12,0.9,'sine',0.35)})}},
 bell:{name:'Bell 🔔',p:function(c,o,t){[[880,0.5],[1760,0.2],[2640,0.12],[3520,0.07]].forEach(function(h){tone(c,o,h[0],t,1.6,'sine',h[1])})}},
 pop:{name:'Pop 🫧',p:function(c,o,t){tone(c,o,300,t,0.12,'sine',0.7,1200);tone(c,o,500,t+0.13,0.1,'sine',0.5,1600)}},
 ding:{name:'Soft ding 🌸',p:function(c,o,t){tone(c,o,1046,t,1.0,'sine',0.3);tone(c,o,2093,t,0.6,'sine',0.08)}}
};
function play(key,force){if(!S.on&&!force)return;var c=ctx();if(!c)return;if(c.state==='suspended')c.resume();var snd=SOUNDS[key]||SOUNDS.chime;var g=c.createGain();g.gain.value=Math.max(0,Math.min(1,S.vol));g.connect(c.destination);try{snd.p(c,g,c.currentTime+0.02)}catch(e){}}
// ---------- UI ----------
var css=`#ncBell,#ncGear{position:fixed;top:10px;z-index:9000;width:42px;height:42px;border-radius:50%;border:0;background:#7b3fa8;color:#fff;font-size:20px;box-shadow:0 3px 10px rgba(59,20,80,.35);cursor:pointer}
#ncBell{right:10px}#ncGear{right:58px}#ncBadge{position:absolute;top:-3px;right:-3px;background:#e6a1c6;color:#3b1450;border-radius:10px;font:bold 11px sans-serif;padding:2px 6px;min-width:18px}
#ncToasts{position:fixed;top:60px;right:10px;left:10px;z-index:9500;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none}
.ncT{pointer-events:auto;display:flex;gap:10px;align-items:center;max-width:360px;width:100%;background:linear-gradient(135deg,#7b3fa8,#3b1450);color:#fff;border-radius:16px;padding:10px 12px;box-shadow:0 8px 24px rgba(59,20,80,.45);animation:ncIn .35s ease;font-family:inherit}
.ncT img{width:52px;height:52px;border-radius:10px;object-fit:cover;background:#efe6fa}.ncT .ic{width:52px;height:52px;border-radius:10px;background:#efe6fa;display:flex;align-items:center;justify-content:center;font-size:26px}
.ncT b{display:block;font-size:15px}.ncT span{font-size:13px;opacity:.9}.ncT .x{margin-left:auto;background:none;border:0;color:#fff;font-size:18px;cursor:pointer}
@keyframes ncIn{from{transform:translateY(-14px);opacity:0}to{transform:none;opacity:1}}
.ncP{position:fixed;inset:0;z-index:9600;background:rgba(42,22,54,.55);display:none;align-items:flex-start;justify-content:center;padding:60px 10px}
.ncP.show{display:flex}.ncP .box{background:#f7f2fc;color:#2a1636;border-radius:18px;width:100%;max-width:420px;max-height:75vh;overflow:auto;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.3)}
.ncP h3{margin:0 0 8px;color:#3b1450}.ncP .it{display:flex;gap:10px;align-items:center;background:#fff;border-radius:12px;padding:8px;margin:6px 0;border-left:4px solid #7b3fa8}
.ncP .it.unread{background:#efe6fa}.ncP .it img{width:44px;height:44px;border-radius:8px;object-fit:cover}.ncP .it small{color:#6b5a78}
.ncP button.b{background:#7b3fa8;color:#fff;border:0;border-radius:10px;padding:8px 12px;margin:4px 4px 0 0;cursor:pointer}
.ncP label{display:block;margin:10px 0 4px;font-weight:600}.ncP select,.ncP input[type=range]{width:100%}`;
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
var root=document.createElement('div');root.innerHTML='<button id="ncGear" aria-label="Sound settings">⚙️</button><button id="ncBell" aria-label="Notifications">🔔<span id="ncBadge" style="display:none">0</span></button><div id="ncToasts"></div>'+
 '<div class="ncP" id="ncPanel"><div class="box"><h3>💜 Notifications</h3><div id="ncList"></div><button class="b" id="ncRead">Mark all read</button><button class="b" id="ncClose">Close</button></div></div>'+
 '<div class="ncP" id="ncSet"><div class="box"><h3>🎵 Sound & alert settings</h3>'+
 '<label><input type="checkbox" id="ncOn"> Sound on</label>'+
 '<label for="ncSale">Sound for sales</label><select id="ncSale"></select><button class="b" data-pv="ncSale">▶ Preview</button>'+
 '<label for="ncOther">Sound for other notifications</label><select id="ncOther"></select><button class="b" data-pv="ncOther">▶ Preview</button>'+
 '<label for="ncVol">Volume <span id="ncVolV"></span></label><input type="range" id="ncVol" min="0" max="100">'+
 '<label>Phone/system notifications</label><button class="b" id="ncSys"></button><div id="ncSysMsg" style="font-size:12px;color:#6b5a78;margin-top:4px">Alerts come when the app is open or was recently open. Fully closed = you will see them next time you open it.</div>'+
 '<div style="margin-top:12px"><button class="b" id="ncSetClose">Done</button></div></div></div>';
document.body.appendChild(root);
function $(i){return document.getElementById(i)}
var H=jget(LS.hist,[]);
function badge(){var n=H.filter(function(h){return !h.read}).length;$('ncBadge').textContent=n>99?'99+':n;$('ncBadge').style.display=n?'block':'none'}
function renderList(){$('ncList').innerHTML=H.length?H.map(function(h){return '<div class="it'+(h.read?'':' unread')+'">'+(h.photo?'<img src="'+esc(h.photo)+'" alt="">':'<div style="font-size:26px">'+(h.kind==='sale'?'💰':'💜')+'</div>')+
 '<div><b>'+esc(h.title)+'</b><br>'+esc(h.body||'')+'<br><small>'+new Date(h.ts).toLocaleString()+'</small></div></div>'}).join(''):'<p>No notifications yet.</p>'}
function addHist(n){H.unshift(n);H=H.slice(0,200);jset(LS.hist,H);badge()}
function toast(n){var t=document.createElement('div');t.className='ncT';t.innerHTML=(n.photo?'<img src="'+esc(n.photo)+'" alt="">':'<div class="ic">'+(n.kind==='sale'?'💰':'💜')+'</div>')+'<div><b>'+esc(n.title)+'</b><span>'+esc(n.body||'')+'</span></div><button class="x" aria-label="Dismiss">×</button>';
 t.querySelector('.x').onclick=function(){t.remove()};t.onclick=function(e){if(e.target.className!=='x'){t.remove();openPanel()}};
 var box=$('ncToasts');box.appendChild(t);while(box.children.length>4)box.firstChild.remove();setTimeout(function(){t.remove()},9000)}
function sysNotify(list){if(!S.sys||!window.Notification||Notification.permission!=='granted'||!list.length)return;
 var title=list.length===1?list[0].title:list.length+' new notifications',body=list.slice(0,4).map(function(n){return n.title.replace(/^Sold! /,'')+(n.body?' - '+n.body:'')}).join('\n');
 var opt={body:body,icon:'./apple-touch-icon.png',badge:'./apple-touch-icon.png',tag:'sc-'+Date.now(),image:list[0].photo||undefined};
 try{if(navigator.serviceWorker&&navigator.serviceWorker.ready){navigator.serviceWorker.ready.then(function(r){r.showNotification(title,opt)}).catch(function(){new Notification(title,opt)})}else new Notification(title,opt)}catch(e){}}
function fire(list){if(!list.length)return;list.forEach(function(n){addHist(n)});list.slice(0,4).forEach(function(n,i){setTimeout(function(){toast(n)},i*350)});
 if(list.length>4)toast({kind:'other',title:'+'+(list.length-4)+' more',body:'Tap the bell to see them all'});
 play(list.some(function(n){return n.kind==='sale'})?S.sale:S.other);if(document.hidden)sysNotify(list);else if(S.sys)sysNotify(list)}
function key(s){var m=String(s.url||'').match(/listing\/([^/?#]+)/);return m?m[1]:(s.id||s.title)}
function money(p){p=Number(p)||0;return '$'+(p%1?p.toFixed(2):p)}
var busy=false;
function check(){if(busy)return Promise.resolve();busy=true;
 return Promise.all([(window.loadFeed?window.loadFeed():fetch('./posh_feed.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null})).catch(function(){return null}),
  fetch('./notifications.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})]).then(function(a){
  var out=[],f=a[0],g=a[1];
  if(f&&f.sold){var seen=jget(LS.seen,null),ids=f.sold.map(key);
   if(seen===null){jset(LS.seen,ids)} // first run: baseline, no flood of old sales
   else{var ss={};seen.forEach(function(i){ss[i]=1});f.sold.forEach(function(s){var k=key(s);if(!ss[k]){var p=s.sold_price_if_available||s.price;
     out.push({id:'sale-'+k,kind:'sale',title:'Sold! '+(s.title||'An item')+' for '+money(p),body:s.sold_date_if_available?'Sold '+s.sold_date_if_available:'',photo:s.photo||'',url:s.url,ts:Date.now(),read:false})}});
    var keep={};seen.concat(ids).forEach(function(i){keep[i]=1});jset(LS.seen,Object.keys(keep).slice(-3000))}}
  if(g&&g.notifications){var gs=jget(LS.gen,[]),gm={};gs.forEach(function(i){gm[i]=1});
   g.notifications.forEach(function(n){var id=n.id||n.title;if(gm[id])return;gs.push(id);out.push({id:'gen-'+id,kind:'other',title:n.title||'Update',body:n.body||'',photo:n.photo||'',ts:Date.now(),read:false})});jset(LS.gen,gs)}
  fire(out);busy=false;return out}).catch(function(){busy=false})}
function openPanel(){renderList();$('ncPanel').classList.add('show')}
$('ncBell').onclick=openPanel;$('ncClose').onclick=function(){$('ncPanel').classList.remove('show');H.forEach(function(h){h.read=true});jset(LS.hist,H);badge()};
$('ncRead').onclick=function(){H.forEach(function(h){h.read=true});jset(LS.hist,H);badge();renderList()};
['ncPanel','ncSet'].forEach(function(i){$(i).addEventListener('click',function(e){if(e.target.id===i)$(i).classList.remove('show')})});
var opts=Object.keys(SOUNDS).map(function(k){return '<option value="'+k+'">'+SOUNDS[k].name+'</option>'}).join('');$('ncSale').innerHTML=opts;$('ncOther').innerHTML=opts;
function sysLabel(){var sup=!!window.Notification;$('ncSys').textContent=!sup?'Not supported on this device':Notification.permission==='denied'?'Blocked in phone settings':S.sys&&Notification.permission==='granted'?'✅ On (tap to turn off)':'Turn on phone notifications';$('ncSys').disabled=!sup||Notification.permission==='denied'}
function fillSet(){$('ncOn').checked=S.on;$('ncSale').value=S.sale;$('ncOther').value=S.other;$('ncVol').value=Math.round(S.vol*100);$('ncVolV').textContent=Math.round(S.vol*100)+'%';sysLabel()}
$('ncGear').onclick=function(){fillSet();$('ncSet').classList.add('show')};$('ncSetClose').onclick=function(){$('ncSet').classList.remove('show')};
$('ncOn').onchange=function(){S.on=this.checked;saveS()};$('ncSale').onchange=function(){S.sale=this.value;saveS();play(S.sale,true)};$('ncOther').onchange=function(){S.other=this.value;saveS();play(S.other,true)};
$('ncVol').oninput=function(){S.vol=this.value/100;$('ncVolV').textContent=this.value+'%';saveS()};$('ncVol').onchange=function(){play(S.sale,true)};
Array.prototype.forEach.call(document.querySelectorAll('[data-pv]'),function(b){b.onclick=function(){unlock();play($(b.getAttribute('data-pv')).value,true)}});
$('ncSys').onclick=function(){if(!window.Notification)return;if(S.sys&&Notification.permission==='granted'){S.sys=false;saveS();sysLabel();return}
 Notification.requestPermission().then(function(p){S.sys=p==='granted';saveS();sysLabel();if(S.sys)sysNotify([{title:'Notifications are on 💜',body:"You'll get a ping when something sells."}])})};
badge();
setTimeout(check,1200);setInterval(check,3*60*1000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)check()});
window.ShantellNotify={check:check,play:play,sounds:Object.keys(SOUNDS),settings:function(){return S},history:function(){return H},fire:fire};
})();
