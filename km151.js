/* ===== v151 panel registry (keyed by ID / app-state preserving) ===== */
(function(){
  var PENCIL='\u270F\uFE0F', PIN='\uD83D\uDCCD', Wrench='\uD83D\uDEE0', Book='\uD83D\uDCD6',
      Memo='\uD83D\uDCDD', Cam='\uD83D\uDCF7', House='\uD83C\uDFD8', Info='\u2139\uFE0F',
      Map='\uD83D\uDDFA', Gear='\uD83D\uDD27', Box='\uD83E\uDDF0';
  /* ボタン定義は「ID → アイコン/名称/起動元/閉じ元」の対応表で持ち、必ずIDで結び付ける */
  var REG=[
    {id:'kmDrawPanel', icon:PENCIL, label:'手描きトレース v129',  openers:['kmDrawMin','drawBtn'], closers:['kmDvMin'], chip:'kmDrawMin', chipish:true, chipText:'\u270F\uFE0F 手描きトレース \u25B4'},
    {id:'drawPanel',   icon:Wrench, label:'街道を手で描く・直す（別画面）', openers:['drawBtn'], closers:['dpClose']},
    {id:'kmPosFixPanel', icon:PIN, label:'位置修正モード', openers:['kmPosFixBtn'], closers:['kmPosFixClose']},
    {id:'kaidoModal',  icon:Book, label:'旧街道', openers:['kaidoBtn'], closers:['kaidoClose']},
    {id:'memoModal',   icon:Memo, label:'メモ一覧', openers:['memoListBtn','memoBtn'], closers:['memoModalClose']},
    {id:'memoAddModal',icon:Memo, label:'メモ追加', openers:['memoBtn'], closers:['memoModalClose']},
    {id:'photoModal',  icon:Cam,  label:'写真', openers:['photoBtn'], closers:['photoModalClose']},
    {id:'nakaModal',   icon:House,label:'宿場一覧', openers:['nakaListBtn'], closers:['nakaClose']},
    {id:'installModal',icon:Info, label:'インストール案内', openers:[], closers:[]},
    {id:'kmGeomPanel', icon:Map,  label:'地形パネル', openers:[], closers:['kmGeomClose']},
    {id:'kmEdPanel',   icon:Gear, label:'編集パネル', openers:[], closers:[]}
  ];
  var BY={}; for(var i=0;i<REG.length;i++){ BY[REG[i].id]=REG[i]; }
  var Z=2147483000;
  var TXT={kmDrawPanel:['手描きトレース','手描き'], drawPanel:['手描き'], kmPosFixPanel:['位置修正'],
           kaidoModal:['街道一覧'], memoModal:['メモ一覧'], memoAddModal:['メモ追加'],
           photoModal:['写真'], nakaModal:['宿場']};

  function vis(el){ if(!el) return false;
    try{ var s=getComputedStyle(el);
      if(s.display==='none'||s.visibility==='hidden'||parseFloat(s.opacity||'1')===0) return false;
      var r=el.getBoundingClientRect(); return r.width>1 && r.height>1; }catch(e){ return false; } }
  window.__pnlVis=vis;
  function uncover(el){ var e=el.parentElement;
    while(e&&e!==document.body){ try{ if(getComputedStyle(e).display==='none') e.style.display='block'; }catch(x){} e=e.parentElement; } }
  function clean(el){ if(!el) return false;
    try{ var r=el.getBoundingClientRect(); if(r.width<6||r.height<6) return false;
      var t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
      while(t && t.id && /^pnl/.test(t.id) && t.id!=='pnlBtn') t=t.parentElement;   /* 自前UIは無視 */
      return !!(t && (t===el || el.contains(t))); }catch(e){ return false; } }
  function clickIf(id){ var b=document.getElementById(id); if(!b||!clean(b)) return false;
    try{ b.click(); return true; }catch(e){ return false; } }
  function byText(words){ if(!words||!words.length) return null;
    var all=document.body.getElementsByTagName('*');
    for(var i=0;i<all.length;i++){
      var el=all[i], tx=el.textContent||''; if(!tx) continue;
      var hit=false; for(var k=0;k<words.length;k++){ if(tx.indexOf(words[k])>=0){ hit=true; break; } }
      if(!hit||el.children.length>0) continue;
      var e=el,d=0; while(e&&e!==document.body&&d<5){ if(clean(e)) return e; e=e.parentElement; d++; } }
    return null; }

  function show(pid){
    var d=BY[pid], el=document.getElementById(pid), via='';
    if(el && vis(el)){ if(LOCK[pid]) delete LOCK[pid]; return {ok:true, via:'already', id:pid}; }
    if(d && d.chipish){
      delete LOCK[pid];
      if(el){ uncover(el); try{ el.style.removeProperty('visibility');
        el.style.setProperty('display','block','important'); }catch(e){} }
      /* v154: 自動での開き直しを停止（画面が勝手に出る原因） */
      el=document.getElementById(pid);
      return {ok:!!(el&&vis(el)), via:'chip-force', id:pid};
    }
    var L=(d&&d.openers)||[];
    for(var i=0;i<L.length;i++){
      var ob=document.getElementById(L[i]); if(!ob) continue;
      try{ ob.click(); via='app:'+L[i]; }catch(e){ continue; }
      el=document.getElementById(pid);
      if(el&&vis(el)) return {ok:true,via:via,id:pid}; }
    var t=byText(TXT[pid]);
    if(t){ try{ t.click(); via='text'; }catch(e){}
      el=document.getElementById(pid); if(el&&vis(el)) return {ok:true,via:via,id:pid}; }
    el=document.getElementById(pid);
    if(el){ uncover(el); try{ el.style.removeProperty('display'); el.style.removeProperty('visibility');
      if(getComputedStyle(el).display==='none') el.style.display=(el.classList.contains('modal')?'flex':'block'); }catch(e){} }
    /* v154: 自動での開き直しを停止 */
    return {ok:!!(el&&vis(el)), via:'forced', id:pid};
  }
  var LOCK={}, SHOWLOCK={};
  function hide(pid){
    delete SHOWLOCK[pid];
    LOCK[pid]=Date.now()+2600;
    var d=BY[pid], used=null, L=(d&&d.closers)||[];
    for(var i=0;i<L.length;i++){ var b=document.getElementById(L[i]);
      if(b&&vis(b)){ try{ b.click(); used=L[i]; }catch(e){} break; } }
    if(pid==='kmPosFixPanel'&&typeof window.__kmPosFixSetMode==='function'){ try{ window.__kmPosFixSetMode(false); }catch(e){} }
    var el=document.getElementById(pid);
    if(el&&vis(el)){ try{ el.style.removeProperty('visibility'); el.style.setProperty('display','none','important'); }catch(e){} }
    if(d&&d.chip){ var ch=document.getElementById(d.chip);
      if(ch){ try{ ch.style.display='block'; ch.style.removeProperty('visibility'); }catch(e){} } }
    el=document.getElementById(pid);
    return {ok:!(el&&vis(el)), via:used||'style', id:pid};
  }
  window.__pnlShow=function(id){ return show(id).ok; };
  window.__pnlHide=function(id){ return hide(id).ok; };
  window.__pnlReg=function(){ return REG.map(function(r){ return {id:r.id, icon:r.icon, label:r.label,
    text:(r.icon+' '+r.label), exists:!!document.getElementById(r.id), vis:vis(document.getElementById(r.id))}; }); };
  window.__pnlVisible=function(){ var o=[]; for(var i=0;i<REG.length;i++){ if(vis(document.getElementById(REG[i].id))) o.push(REG[i].id); } return o; };
  window.__pnlScan=function(){ return REG.map(function(r){ return r.id; }); };


  /* ---- 各画面に必ず✕を付ける ---- */
  function attachClose(pid){
    var el=document.getElementById(pid); if(!el) return false;
    if(!el.id) return false;
    if(document.getElementById('pnlClose_'+pid)) return true;
    try{ if(getComputedStyle(el).position==='static') el.style.position='relative'; }catch(e){}
    var b=document.createElement('button');
    b.type='button'; b.id='pnlClose_'+pid; b.setAttribute('aria-label','閉じる'); b.setAttribute('title','閉じる');
    b.textContent='✕';
    b.style.cssText='position:absolute;top:4px;right:4px;width:40px;height:40px;min-width:40px;border-radius:50%;'
      +'background:#d32f2f;color:#fff;border:2px solid #fff;font-size:20px;line-height:1;padding:0;cursor:pointer;'
      +'touch-action:manipulation;z-index:'+Z+';box-shadow:0 2px 7px rgba(0,0,0,.5)';
    try{ el.appendChild(b); return true; }catch(e){ return false; }
  }
  /* ---- 手描きトレース用の常時復帰チップ（自分で作るので消されない） ---- */
  function ensureChip(pid){
    var r=BY[pid]; if(!r||!r.chipish) return null;
    var id='pnlChip_'+pid, ch=document.getElementById(id);
    if(!ch){
      ch=document.createElement('button'); ch.type='button'; ch.id=id;
      ch.setAttribute('data-for',pid);
      ch.textContent=r.chipText||('\u270F\uFE0F 手描きトレース \u25B4');
      ch.style.cssText='position:fixed;right:6px;bottom:104px;z-index:'+(Z-3)+';padding:10px 12px;font-size:13px;'
        +'font-weight:bold;border-radius:10px;border:2px solid #b45309;background:#fff7ed;color:#9a3412;'
        +'box-shadow:0 2px 8px rgba(0,0,0,.35);touch-action:manipulation';
      document.body.appendChild(ch);
    } else if(ch.parentElement!==document.body){ document.body.appendChild(ch); }
    return ch;
  }
  function syncPanels(){
    for(var i=0;i<REG.length;i++){
      var r=REG[i], el=document.getElementById(r.id);
      if(el && vis(el)) attachClose(r.id);
      if(r.chipish){
        var ch=ensureChip(r.id);
        if(ch){ var on=!!(el&&vis(el));
          ch.style.display = on ? 'none' : 'block'; }
      }
    }
  }

  function el(tag, css, text){ var e=document.createElement(tag); if(css) e.style.cssText=css;
    if(text!=null) e.textContent=text; return e; }
  function ensureUI(){
    var rb=document.getElementById('pnlBtn');
    /* v154: 1秒ごとに作り直していたのをやめ、欠けている時だけ作る */
    if(!rb){ rb=el('button','position:fixed;left:0;top:40%;z-index:'+(Z-2)+';font-size:13px;font-weight:bold;'
      +'padding:10px 8px;border:1px solid #1565c0;border-left:0;border-radius:0 10px 10px 0;'
      +'background:#e3f2fd;color:#0d47a1;box-shadow:0 1px 6px rgba(0,0,0,.34);touch-action:manipulation',
      Box+' パネル');
      rb.type='button'; rb.id='pnlBtn'; document.body.appendChild(rb); }
    else if(rb.parentElement!==document.body) document.body.appendChild(rb);
    var rp=document.getElementById('pnlPanel');
    if(!rp){
      rp=el('div','position:fixed;left:50%;top:8%;transform:translateX(-50%);z-index:'+(Z-1)+';display:none;'
        +'background:#fff;border:1px solid #90a4ae;border-radius:12px;padding:10px;width:min(94vw,400px);'
        +'max-height:76vh;overflow:auto;font-size:12px;box-shadow:0 4px 18px rgba(0,0,0,.38)');
      rp.id='pnlPanel';
      var h=el('div','font-weight:bold;margin-bottom:6px', Box+' パネル管理'); rp.appendChild(h);
      var st=el('div','color:#555;line-height:1.5;margin-bottom:8px','閉じても「表示」で戻せます。'); st.id='pnlStat'; rp.appendChild(st);
      var q=el('div','display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px'); q.id='pnlQuick'; rp.appendChild(q);
      var rw=el('div',null,null); rw.id='pnlRows'; rp.appendChild(rw);
      var foot=el('div','text-align:right;margin-top:8px',null); var xx=el('button',null,'✕'); xx.type='button'; xx.id='pnlX';
      foot.appendChild(xx); rp.appendChild(foot);
      document.body.appendChild(rp);
    }
    var qq=document.getElementById('pnlQuick');
    if(qq && !qq.children.length){
      ['kmDrawPanel','drawPanel','kmPosFixPanel'].forEach(function(pid){
        var r=BY[pid]; if(!r) return;
        var b=el('button','flex:1 1 46%;padding:9px 6px;font-size:12px;touch-action:manipulation;min-width:130px',
                 r.icon+' '+r.label);
        b.type='button'; b.id='pnlQuick_'+pid; qq.appendChild(b); });
    }
    var rows=document.getElementById('pnlRows');
    var _pp=document.getElementById('pnlPanel');
    var _open=false; try{ _open=!!(_pp&&getComputedStyle(_pp).display!=='none'); }catch(e){}
    if(rows && !_open){
      rows.innerHTML='';
      for(var i=0;i<REG.length;i++){
        var r=REG[i], live=!!document.getElementById(r.id);
        var row=el('div','display:flex;gap:6px;align-items:center;padding:5px 0;border-top:1px solid #eee'
          +(live?'':';opacity:.45'));
        var sp=el('span','flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap');
        sp.appendChild(document.createTextNode(r.icon+' '+r.label));
        sp.appendChild(document.createElement('br'));
        var sub=el('span','color:#777;font-size:11px', r.id+(live?'':' / 未生成')); sp.appendChild(sub);
        var s=el('button',null,'表示'); s.type='button'; s.id='pnlShow_'+r.id;
        var hb=el('button',null,'閉じる'); hb.type='button'; hb.id='pnlHide_'+r.id;
        row.appendChild(sp); row.appendChild(s); row.appendChild(hb); rows.appendChild(row);
      }
    }
  }
  window.__pnlBuild=ensureUI;

  function inR(e,x,y){ if(!e) return false;
    try{ if(getComputedStyle(e).display==='none') return false;
      var r=e.getBoundingClientRect(); if(r.width<2||r.height<2) return false;
      return x>=r.left-4 && x<=r.right+4 && y>=r.top-4 && y<=r.bottom+4; }catch(err){ return false; } }
  var last=0;
  function hot(x,y){
    var list=document.querySelectorAll('[id^="pnlClose_"],[id^="pnlShow_"],[id^="pnlHide_"],[id^="pnlQuick_"],[id^="pnlChip_"],#pnlBtn,#pnlX');
    for(var i=0;i<list.length;i++){
      var e=list[i]; if(!inR(e,x,y)) continue;
      var id=e.id;
      if(id.indexOf('pnlClose_')===0){ var cp=id.slice(9); hide(cp); return true; }
      if(id.indexOf('pnlChip_')===0){ var cpp=id.slice(8); show(cpp); return true; }
      if(id.indexOf('pnlShow_')===0||id.indexOf('pnlQuick_')===0){
        var pid=id.replace(/^pnl(Show|Quick)_/,'');
        var res=show(pid);
        var st=document.getElementById('pnlStat');
        if(st) st.textContent=(res.ok?'OK 表示: ':'未確認: ')+(BY[pid]?BY[pid].label:pid)+' ('+res.via+')';
        if(id.indexOf('pnlShow_')===0) e.style.background=res.ok?'#a5d6a7':'#ffcdd2';
        return true;
      }
      if(id.indexOf('pnlHide_')===0){
        var p2=id.slice(8), r2=hide(p2), st2=document.getElementById('pnlStat');
        if(st2) st2.textContent=(r2.ok?'OK 非表示: ':'残存: ')+(BY[p2]?BY[p2].label:p2)+' ('+r2.via+')';
        e.style.background=''; return true;
      }
      if(id==='pnlBtn'){ var m=document.getElementById('pnlPanel'); if(!m) return false;
        if(getComputedStyle(m).display==='none'){ ensureUI(); m.style.display='block'; } else { m.style.display='none'; }
        return true; }
      if(id==='pnlX'){ var m2=document.getElementById('pnlPanel'); if(m2) m2.style.display='none'; return true; }
    }
    return false;
  }
  function down(ev){ var now=Date.now(); if(now-last<350) return;
    if(hot(ev.clientX, ev.clientY)){ last=now;
      if(ev.preventDefault) ev.preventDefault();
      if(ev.stopPropagation) ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); } }
  document.addEventListener('pointerdown', down, true);
  document.addEventListener('touchstart', function(ev){ var t=ev.touches&&ev.touches[0];
    if(t) down({clientX:t.clientX, clientY:t.clientY}); }, true);
  document.addEventListener('keydown', function(e){
    if(e.key!=='Escape'&&e.keyCode!==27) return;
    for(var i=0;i<REG.length;i++){ var e2=document.getElementById(REG[i].id); if(vis(e2)) hide(REG[i].id); }
    var m=document.getElementById('pnlPanel'); if(m) m.style.display='none';
  });
  setInterval(function(){
    var now=Date.now(), k, e;
    for(k in LOCK){
      if(LOCK[k]<now){ delete LOCK[k]; continue; }
      e=document.getElementById(k);
      if(e&&vis(e)){ try{ e.style.setProperty('display','none','important'); }catch(x){} }
    }
    /* v154: SHOWLOCK による強制再表示ループを停止（120msごとに画面を書き換えていた） */
  },120);
setInterval(function(){ ensureUI(); syncPanels(); },1000); ensureUI(); syncPanels();
})();
