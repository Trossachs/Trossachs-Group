(function(){
  var TG = window.TG, U = TG.util, esc = U.esc;
  var IMG = window.TROSSACHS_TEXTURES || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s,r){return (r||document).querySelector(s)};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var C = function(p){ return TG.get(p); };

    var I = {
    web:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M7 9l2 2-2 2M12 13h4"/>',
    ai:'<circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="6" r="1.8"/><circle cx="5" cy="18" r="1.8"/><circle cx="19" cy="18" r="1.8"/><path d="M6.5 7.3l3.4 3M17.5 7.3l-3.4 3M6.5 16.7l3.4-3M17.5 16.7l-3.4-3"/>',
    ux:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 15l3-7 3 7M10 13h4"/>',
    gfx:'<circle cx="12" cy="7" r="3.2"/><circle cx="7" cy="14.5" r="3.2"/><circle cx="17" cy="14.5" r="3.2"/><circle cx="12" cy="12" r="1.2"/>',
    brand:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    prod:'<path d="M5 5l14 14M19 5L5 19"/>',
    tech:'<path d="M12 3l8 5v8l-8 5-8-5V8z"/><circle cx="12" cy="12" r="2.6"/>'
  };
  var FEAT_ICONS = [
    '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a3 3 0 1 0 0-6M18 14c2 .6 3.5 2.6 3.5 5"/>',
    '<path d="M8 7L3 12l5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  ];
  var STAT_ICONS = [
    '<path d="M5 4h14v16H5zM9 9l2 2 4-4"/>',
    '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M15 14.5c3 0 6 1.5 6 4.5"/>',
    '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'
  ];

  /* ---------- project thumbnails (used when no image URL is set) ---------- */
  var ART = {
    dark:'<div class="shot s-dark"><span class="ln" style="top:20px;width:46%"></span><span class="ln" style="top:31px;width:36%"></span><span class="ln" style="top:46px;width:56%;opacity:.45"></span><span class="ln" style="top:55px;width:48%;opacity:.45"></span><span class="orb"></span></div>',
    hosp:'<div class="shot s-hosp"><span class="hd"></span><span class="ln" style="top:24px;width:44%"></span><span class="ln" style="top:35px;width:34%;opacity:.6"></span><span class="bld"></span></div>',
    ice:'<div class="shot s-ice"><i style="left:16%;transform:rotate(-8deg)"></i><i style="left:38%;height:52px;transform:rotate(4deg)"></i><i style="left:60%;transform:rotate(-3deg)"></i></div>',
    farm:'<div class="shot s-farm"><span class="sun"></span></div>',
    mira:'<div class="shot s-mira"><b style="left:12px;top:22px;width:56%"></b><b style="right:12px;top:46px;width:44%;background:rgba(255,120,190,.9)"></b><b style="left:12px;top:70px;width:34%;opacity:.6"></b></div>',
    humara:'<div class="shot s-humara"><u style="left:34%;background:rgba(255,120,60,.7)"></u><u style="left:50%;background:rgba(80,120,255,.75)"></u><b style="left:12px;top:14px;width:30%;height:5px;opacity:.7"></b></div>'
  };
  function projShot(p){
    var src = U.safeUrl(p.image);
    if (src) return '<div class="shot has-img"><img src="'+esc(src)+'" alt="" loading="lazy" decoding="async"></div>';
    if (ART[p.art]) return ART[p.art];
    return '<div class="shot s-gen"><b>'+esc((p.name||'?').trim().charAt(0).toUpperCase())+'</b></div>';
  }

  /* ---------- launching-soon visuals: flat vector mockups, replaced by an image URL when set ---------- */
  var LART = {
    mira:'<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="180" fill="#14305a"/><circle cx="262" cy="42" r="46" fill="#1d4a8c"/><circle cx="262" cy="42" r="22" fill="#4f8cff"/><circle cx="262" cy="42" r="8" fill="#e8f1ff"/><rect x="20" y="30" width="150" height="26" rx="13" fill="#e8f1ff"/><rect x="120" y="68" width="150" height="26" rx="13" fill="#4f8cff"/><rect x="20" y="106" width="96" height="26" rx="13" fill="#e8f1ff" opacity=".7"/><rect x="20" y="144" width="280" height="24" rx="12" fill="#0d2347"/><rect x="32" y="153" width="90" height="6" rx="3" fill="#6f87b3"/></svg>',
    humara:'<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="180" fill="#1f3b66"/><circle cx="130" cy="84" r="46" fill="#e0a02a" opacity=".92"/><circle cx="190" cy="84" r="46" fill="#4f8cff" opacity=".92"/><path d="M160 54a46 46 0 0 1 0 60a46 46 0 0 1 0-60z" fill="#f4f7ff"/><rect x="40" y="18" width="150" height="10" rx="5" fill="#e8f1ff" opacity=".8"/><rect x="40" y="150" width="240" height="14" rx="7" fill="#12294f"/><circle cx="52" cy="157" r="4" fill="#9db4de"/></svg>',
    trowise:'<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="180" fill="#0c2556"/><rect x="18" y="16" width="170" height="70" rx="14" fill="#1b4fc4"/><rect x="32" y="30" width="70" height="8" rx="4" fill="#cfe0ff"/><rect x="32" y="48" width="118" height="16" rx="8" fill="#f2c14e"/><rect x="32" y="72" width="54" height="6" rx="3" fill="#9fbcf5"/><circle cx="252" cy="62" r="40" fill="none" stroke="#173a82" stroke-width="12"/><path d="M252 22a40 40 0 1 1-35 59" fill="none" stroke="#f2c14e" stroke-width="12" stroke-linecap="round"/><rect x="26" y="106" width="22" height="50" rx="5" fill="#1b4fc4"/><rect x="62" y="124" width="22" height="32" rx="5" fill="#1b4fc4"/><rect x="98" y="96" width="22" height="60" rx="5" fill="#f2c14e"/><rect x="134" y="116" width="22" height="40" rx="5" fill="#1b4fc4"/><rect x="170" y="108" width="22" height="48" rx="5" fill="#1b4fc4"/><rect x="214" y="118" width="86" height="8" rx="4" fill="#cfe0ff" opacity=".8"/><rect x="214" y="136" width="62" height="8" rx="4" fill="#cfe0ff" opacity=".5"/></svg>'
  };
  function slideArt(s){
    var src = U.safeUrl(s.image);
    if (src) return '<img src="'+esc(src)+'" alt="" loading="lazy" decoding="async">';
    if (LART[s.art]) return LART[s.art];
    return '<div class="cf-gen"><b>'+esc((s.title||'?').trim().charAt(0).toUpperCase())+'</b></div>';
  }

  /* ---------- toast ---------- */
  var toastEl = $('#toast'), toastT;
  function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function(){toastEl.classList.remove('show')}, 2600); }
  $('#year').textContent = new Date().getFullYear();

  /* ---------- helpers ---------- */
  var rvOn = true; /* false while re-rendering from live edits, so nothing flashes */
  function rv(v,d){ return rvOn ? ' data-rv="'+v+'"'+(d?' data-d="'+d+'"':'') : ''; }
  function icoTile(s,cls){ return '<div class="'+cls+'"><svg viewBox="0 0 24 24">'+(I[s.icon]||I.tech)+'</svg></div>'; }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function pair(p){ return Array.isArray(p) ? p : [String(p||''), '']; }
  var SERVICES = [], BY = {}, PROJ = {};
  function loadData(){
    SERVICES = arr(C('services.items')).filter(function(s){ return s && s.slug; });
    BY = {}; SERVICES.forEach(function(s,i){ s.i = i; BY[s.slug] = s; });
    PROJ = {}; arr(C('portfolio.items')).forEach(function(p){ PROJ[p.name] = p.category; });
  }

  /* ---------- content-driven rendering ---------- */
  var sigs = {}, firstRender = true;
  function once(key, val, fn){ var s = JSON.stringify(val); if (sigs[key] === s) return false; sigs[key] = s; fn(); return true; }

  function applyText(){
    $$('[data-c]').forEach(function(el){ var v = C(el.dataset.c); if (typeof v === 'string' || typeof v === 'number') el.textContent = v; });
    $$('[data-q]').forEach(function(el){ var v = C(el.dataset.q); if (typeof v === 'string') el.textContent = '"' + v + '"'; });
  }
  function applyContent(){
    rvOn = firstRender && document.documentElement.classList.contains('rv-on');
    loadData();
    applyText();

    /* logo, avatar, contact details, social links */
    var logo = U.safeUrl(C('site.logoUrl'));
    $$('[data-logo]').forEach(function(im){ if (!im.dataset.def) im.dataset.def = im.getAttribute('src'); var want = logo || im.dataset.def; if (im.getAttribute('src') !== want) im.src = want; });
    var av = $('#avatar'), avUrl = U.safeUrl(C('testimonial.avatar'));
    once('avatar', [avUrl, C('testimonial.initials')], function(){ av.innerHTML = avUrl ? '<img src="'+esc(avUrl)+'" alt="">' : esc(C('testimonial.initials')); av.classList.toggle('has-img', !!avUrl); });
    var em = String(C('contact.email')||''), ph = String(C('contact.phone')||'');
    var cE = $('#cEmail'), cP = $('#cPhone');
    cE.textContent = em; cE.href = em ? 'mailto:' + em : '#contact'; cE.parentElement.parentElement.hidden = !em;
    cP.textContent = ph; cP.href = U.telHref(ph) || '#contact'; cP.parentElement.parentElement.hidden = !ph;
    $$('[data-soc]').forEach(function(a){ var u = U.safeHref(C('footer.' + a.dataset.soc)); a.hidden = !u; if (u) a.href = u; });
    $('#social').hidden = !$$('[data-soc]').some(function(a){ return !a.hidden; });

    /* lists */
    once('svcGrid', SERVICES, function(){
      $('#svcGrid').innerHTML = SERVICES.map(function(s,i){
        return '<a class="card" href="#svc-'+esc(s.slug)+'" data-tilt'+rv('zoom',(i%4)*90+Math.floor(i/4)*120)+'>'+icoTile(s,'ico')+'<h3>'+esc(s.name)+'</h3><p>'+esc(s.tag)+'</p><span class="go">Learn more '+ARROW+'</span></a>';
      }).join('');
    });
    once('track', C('portfolio.items'), function(){
      $('#track').innerHTML = arr(C('portfolio.items')).map(function(p,i){
        return '<article class="proj" data-tilt'+(i<4?rv('right',i*90):'')+'>'+projShot(p)+'<h4>'+esc(p.name)+'</h4><p class="cat">'+esc(p.category)+'</p><div class="tags">'+arr(p.tags).map(function(t){return '<span class="chip">'+esc(t)+'</span>'}).join('')+'</div></article>';
      }).join('');
      carState();
    });
    once('feats', C('about.features'), function(){
      $('#feats').innerHTML = arr(C('about.features')).map(function(f,i){
        return '<div class="feat"'+rv('right',i*100)+'><div class="fi"><svg viewBox="0 0 24 24">'+FEAT_ICONS[i%FEAT_ICONS.length]+'</svg></div><div><b>'+esc(f.title)+'</b><span>'+esc(f.text)+'</span></div></div>';
      }).join('');
    });
    once('stats', C('stats.items'), function(){
      $('#stats').innerHTML = arr(C('stats.items')).map(function(s,i){
        var v = String(s.value == null ? '' : s.value), m = /^(\d+)(.*)$/.exec(v);
        return '<div class="stat"'+rv('zoom',i*100)+'><div class="si"><svg viewBox="0 0 24 24">'+STAT_ICONS[i%STAT_ICONS.length]+'</svg></div><div><strong'+(m?' data-count="'+m[1]+'" data-suffix="'+esc(m[2])+'"':'')+'>'+esc(v)+'</strong><span>'+esc(s.label)+'</span></div></div>';
      }).join('');
      if (counted) counted = false, watchCount();
    });
    once('process', C('process.items'), function(){
      $('#process').innerHTML = arr(C('process.items')).map(function(s,i){
        return '<div class="step"'+rv('up',i*100)+'><em>'+(i+1)+'</em><div><b>'+esc(s.title)+'</b><span>'+esc(s.text)+'</span></div></div>';
      }).join('');
    });
    once('launch', C('launch.items'), renderLaunch);
    if (!firstRender) once('route', [location.hash, SERVICES], function(){ if (current !== 'svc') return; var h = decodeURIComponent(location.hash.slice(1)); if (h === 'svc-all' || BY[h.slice(4)]) showService(h, true); else location.hash = 'services'; });
    prepare(document.body);
    firstRender = false; rvOn = true;
  }

  /* ---------- service pages ---------- */
  var viewHome = $('#view-home'), viewSvc = $('#view-svc'), current = 'home';

  function othersGrid(skip){
    return SERVICES.filter(function(s){return s.slug!==skip}).map(function(s,i){
      return '<a class="card" href="#svc-'+esc(s.slug)+'" data-tilt'+rv('zoom',(i%4)*80)+'>'+icoTile(s,'ico')+'<h3>'+esc(s.name)+'</h3></a>';
    }).join('');
  }
  function renderService(s){
    var prev = SERVICES[(s.i+SERVICES.length-1)%SERVICES.length], next = SERVICES[(s.i+1)%SERVICES.length];
    var chips = arr(s.stack).slice(0,3);
    var name = esc(s.name);
    viewSvc.innerHTML =
    '<div class="wrap sp">'+
      '<nav class="crumbs" aria-label="Breadcrumb"'+rv('fade')+'><a href="#home">Home</a><span>/</span><a href="#svc-all">Services</a><span>/</span><span aria-current="page">'+name+'</span></nav>'+
      '<section class="panel sp-hero"'+rv('up')+'>'+
        '<div><p class="eyebrow"'+rv('up')+'>Service</p><h1 class="display"'+rv('up',80)+'>'+name+'</h1><p class="lead"'+rv('up',160)+'>'+esc(s.lead)+'</p>'+
        '<div class="sp-actions"'+rv('up',240)+'><a class="btn btn-primary" href="#contact">Start a project <span class="arr">'+ARROW+'</span></a><a class="btn btn-outline" href="#svc-all">All services</a></div></div>'+
        '<div class="scene sv" aria-hidden="true"'+rv('zoom',200)+'><div class="scene-in">'+
          '<div class="glass glass-icon">'+icoTile(s,'big-ico')+'</div>'+
          chips.map(function(c,i){return '<div class="glass glass-chip gc'+(i+1)+'">'+esc(c)+'</div>'}).join('')+
        '</div></div>'+
      '</section>'+
      '<section class="panel blk"><p class="eyebrow"'+rv('up')+'>What we deliver</p><h2 class="display"'+rv('up',80)+'>Everything included in '+name+'</h2>'+
        '<div class="d-grid">'+arr(s.deliver).map(function(d,i){d=pair(d);return '<div class="card" data-tilt'+rv('up',(i%3)*90)+'><h3>'+esc(d[0])+'</h3><p>'+esc(d[1])+'</p></div>'}).join('')+'</div></section>'+
      '<section class="panel blk"><p class="eyebrow"'+rv('up')+'>How it works</p><h2 class="display"'+rv('up',80)+'>From first call to launch</h2>'+
        '<div class="steps4">'+arr(s.steps).map(function(t,i){t=pair(t);return '<div class="step"'+rv('up',i*110)+'><em>'+(i+1)+'</em><div><b>'+esc(t[0])+'</b><span>'+esc(t[1])+'</span></div></div>'}).join('')+'</div></section>'+
      '<div class="split">'+
        '<section class="panel blk"'+rv('left')+'><p class="eyebrow">Tools we work with</p><h2 class="display">Our toolkit</h2><div class="chips">'+arr(s.stack).map(function(t){return '<span class="chip">'+esc(t)+'</span>'}).join('')+'</div></section>'+
        '<section class="panel blk"'+rv('right',100)+'><p class="eyebrow">Seen in our work</p><h2 class="display">Related projects</h2><div class="work-links">'+arr(s.projects).map(function(p){return '<a href="#portfolio"><span>'+esc(p)+'</span><small>'+esc(PROJ[p]||'')+'</small></a>'}).join('')+'</div></section>'+
      '</div>'+
      '<section class="panel blk"><p class="eyebrow"'+rv('up')+'>Questions</p><h2 class="display"'+rv('up',80)+'>Good to know</h2>'+
        arr(s.faq).map(function(q,i){q=pair(q);return '<details'+rv('up',i*90)+'><summary>'+esc(q[0])+'</summary><p>'+esc(q[1])+'</p></details>'}).join('')+'</section>'+
      '<section class="panel blk"><p class="eyebrow"'+rv('up')+'>More from Trossachs Group</p><h2 class="display"'+rv('up',80)+'>Other services</h2><div class="others">'+othersGrid(s.slug)+'</div></section>'+
      '<section class="panel cta"'+rv('zoom')+'><p class="eyebrow">'+esc(C('contact.eyebrow'))+'</p><h2 class="display">Let\'s talk about your '+name+' project</h2><p>Tell us what you want to achieve and we\'ll suggest where to begin.</p><a class="btn btn-primary" href="#contact">'+esc(C('site.navCta'))+' <span class="arr">'+ARROW+'</span></a></section>'+
      '<div class="pager"'+rv('up')+'><a href="#svc-'+esc(prev.slug)+'"><small>Previous</small><b>'+esc(prev.name)+'</b></a><a class="nx" href="#svc-'+esc(next.slug)+'"><small>Next</small><b>'+esc(next.name)+'</b></a></div>'+
    '</div>';
  }
  function renderAll(){
    viewSvc.innerHTML =
    '<div class="wrap sp">'+
      '<nav class="crumbs" aria-label="Breadcrumb"'+rv('fade')+'><a href="#home">Home</a><span>/</span><span aria-current="page">Services</span></nav>'+
      '<section class="panel all-hero"'+rv('up')+'><p class="eyebrow"'+rv('up')+'>'+esc(C('services.eyebrow'))+'</p><h1 class="display"'+rv('up',80)+'>'+esc(C('services.headA'))+' <span class="grad">'+esc(C('services.headAccent'))+'</span> '+esc(C('services.headB'))+'</h1><p class="lead"'+rv('up',160)+'>'+esc(C('services.allLead'))+'</p></section>'+
      '<div class="rows">'+SERVICES.map(function(s,i){return '<a class="row" href="#svc-'+esc(s.slug)+'"'+rv('up',(i%3)*80)+'>'+icoTile(s,'ico')+'<div><h3>'+esc(s.name)+'</h3><p>'+esc(s.tag)+'</p></div><span class="go">Learn more '+ARROW+'</span></a>'}).join('')+'</div>'+
      '<section class="panel cta"'+rv('zoom')+'><p class="eyebrow">'+esc(C('contact.eyebrow'))+'</p><h2 class="display">'+esc(C('contact.heading'))+'</h2><p>'+esc(C('contact.text'))+'</p><a class="btn btn-primary" href="#contact">'+esc(C('site.navCta'))+' <span class="arr">'+ARROW+'</span></a></section>'+
    '</div>';
  }

  /* ---------- router ---------- */
  var navLinks = $$('#links a');
  function setActive(key){ navLinks.forEach(function(a){ a.classList.toggle('on', a.dataset.key === key); }); }
  function showService(h, keepScroll){
    if (h === 'svc-all') renderAll(); else renderService(BY[h.slice(4)]);
    viewHome.hidden = true; viewSvc.hidden = false; current = 'svc';
    if (!keepScroll) window.scrollTo({top:0, behavior:'instant'});
    setActive('services'); prepare(viewSvc);
  }
  function route(){
    var h = decodeURIComponent((location.hash||'').slice(1)), wasHome = current === 'home';
    if (h === 'svc-all' || (h.indexOf('svc-') === 0 && BY[h.slice(4)])){ showService(h); return; }
    viewSvc.hidden = true; viewHome.hidden = false; current = 'home';
    if (!wasHome){
      var t = h && document.getElementById(h);
      window.scrollTo({top: t ? t.getBoundingClientRect().top + window.scrollY - 60 : 0, behavior:'instant'});
      layout3d();
    }
    spy();
  }
  addEventListener('hashchange', route);

  /* ---------- nav: burger, scroll spy, progress ---------- */
  var nav = $('#nav'), burger = $('#burger'), prog = $('#progress');
  burger.addEventListener('click', function(){ var open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', open); });
  navLinks.forEach(function(a){ a.addEventListener('click', function(){ nav.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }); });
  var spyIds = ['home','services','portfolio','about','process','contact'];
  function spy(){
    if (current !== 'home') return;
    var y = window.scrollY + 140, cur = 'home';
    spyIds.forEach(function(k){ var el = document.getElementById(k); if (el && el.getBoundingClientRect().top + window.scrollY <= y) cur = k; });
    setActive(cur);
  }
  var ticking = false;
  function onScroll(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(function(){
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight, y = window.scrollY;
      prog.style.setProperty('--p', max > 0 ? (y/max).toFixed(4) : 0);
      nav.classList.toggle('scrolled', y > 30);
      spy();
    });
  }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* ---------- scroll reveal ---------- */
  var io = null;
  if (document.documentElement.classList.contains('rv-on')){
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        var el = en.target; io.unobserve(el); el.classList.add('in');
        var d = parseInt(el.dataset.d || '0', 10);
        setTimeout(function(){ el.classList.remove('rv','rv-up','rv-left','rv-right','rv-zoom','rv-fade','in'); }, 1000 + d);
      });
    }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
  }
  function prepare(root){
    if (!io) return;
    $$('[data-rv]', root).forEach(function(el){
      if (el.dataset.rvOn) return; el.dataset.rvOn = '1';
      el.classList.add('rv','rv-'+el.dataset.rv);
      el.style.setProperty('--d', (el.dataset.d||0) + 'ms');
      io.observe(el);
    });
  }

  /* ---------- carousel (portfolio) ---------- */
  var track = $('#track'), prev = $('#prev'), next = $('#next');
  function carState(){ prev.disabled = track.scrollLeft <= 4; next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4; }
  function slide(dir){ track.scrollBy({left: dir * track.clientWidth * .8, behavior: reduce ? 'auto' : 'smooth'}); }
  prev.addEventListener('click', function(){slide(-1)});
  next.addEventListener('click', function(){slide(1)});
  track.addEventListener('scroll', carState, {passive:true});
  track.addEventListener('keydown', function(e){ if(e.key==='ArrowRight'){slide(1)} if(e.key==='ArrowLeft'){slide(-1)} });
  addEventListener('resize', carState);

  /* ---------- launching soon: 3D coverflow of glass cards ---------- */
  var cfStage = $('#cfStage'), cfDots = $('#cfDots'), cfBox = $('#cf'), cfPrev = $('#cfPrev'), cfNext = $('#cfNext');
  var cf = { i:0, n:0, timer:null, hold:false, vis:true, paused:false, swiped:false };
  function renderLaunch(){
    var items = arr(C('launch.items')); cf.n = items.length;
    if (cf.i >= cf.n) cf.i = 0;
    cfStage.innerHTML = items.map(function(s,i){
      return '<article class="cf-card" data-i="'+i+'" role="group" aria-roledescription="slide" aria-label="'+(i+1)+' of '+items.length+'">'+
        '<div class="cf-art">'+slideArt(s)+'</div>'+
        '<div class="cf-body"><div class="cf-top"><span class="cf-badge">'+esc(s.badge)+'</span><span class="cf-meta">'+esc(s.meta)+'</span></div>'+
        '<h3>'+esc(s.title)+'</h3><p class="cf-txt">'+esc(s.text)+'</p>'+
        (s.btn ? '<button class="btn btn-primary" type="button" data-notify="'+esc(s.title)+'">'+esc(s.btn)+' <span class="arr">'+ARROW+'</span></button>' : '')+
        '</div></article>';
    }).join('');
    cfDots.innerHTML = cf.n > 1 ? items.map(function(s,i){ return '<button type="button" class="cf-dot" data-go="'+i+'" aria-label="Show '+esc(s.title)+'"></button>'; }).join('') + (reduce ? '' : '<button type="button" class="cf-pause" id="cfPause" aria-label="Pause slideshow"><svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg></button>') : '';
    cfPrev.hidden = cfNext.hidden = cf.n < 2;
    cfBox.hidden = cf.n === 0;
    posCards(); playCf();
  }
  function posCards(){
    var n = cf.n, half = Math.floor(n/2);
    $$('.cf-card', cfStage).forEach(function(el,i){
      var o = ((i - cf.i + n + half) % n) - half;
      el.style.setProperty('--o', o); el.style.setProperty('--a', Math.abs(o));
      el.classList.toggle('is-active', o === 0); el.classList.toggle('far', Math.abs(o) > 1);
      el.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
      $$('button', el).forEach(function(b){ b.tabIndex = o === 0 ? 0 : -1; });
    });
    $$('.cf-dot', cfDots).forEach(function(d,i){ d.classList.toggle('on', i === cf.i); d.setAttribute('aria-current', i === cf.i ? 'true' : 'false'); });
  }
  function go(i){ if (!cf.n) return; cf.i = (i + cf.n) % cf.n; posCards(); }
  function playCf(){
    clearInterval(cf.timer); cf.timer = null;
    if (reduce || cf.n < 2 || cf.paused) return;
    cf.timer = setInterval(function(){ if (!document.hidden && !cf.hold && cf.vis && viewHome.hidden === false) go(cf.i + 1); }, 5200);
  }
  cfPrev.addEventListener('click', function(){ go(cf.i - 1); });
  cfNext.addEventListener('click', function(){ go(cf.i + 1); });
  cfDots.addEventListener('click', function(e){
    var d = e.target.closest('[data-go]'); if (d) { go(+d.dataset.go); return; }
    var p = e.target.closest('#cfPause'); if (p){
      cf.paused = !cf.paused; p.classList.toggle('is-paused', cf.paused);
      p.setAttribute('aria-label', cf.paused ? 'Play slideshow' : 'Pause slideshow');
      p.innerHTML = cf.paused ? '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>';
      playCf();
    }
  });
  cfBox.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight'){ go(cf.i + 1); e.preventDefault(); } if (e.key === 'ArrowLeft'){ go(cf.i - 1); e.preventDefault(); } });
  cfBox.addEventListener('mouseenter', function(){ cf.hold = true; });
  cfBox.addEventListener('mouseleave', function(){ cf.hold = false; });
  cfBox.addEventListener('focusin', function(){ cf.hold = true; });
  cfBox.addEventListener('focusout', function(){ cf.hold = false; });
  var sx = null;
  cfStage.addEventListener('pointerdown', function(e){ sx = e.clientX; });
  addEventListener('pointerup', function(e){
    if (sx == null) return; var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 45){ go(cf.i + (dx < 0 ? 1 : -1)); cf.swiped = true; setTimeout(function(){ cf.swiped = false; }, 60); }
  });
  cfStage.addEventListener('click', function(e){
    if (cf.swiped) return;
    var c = e.target.closest('.cf-card'); if (!c) return;
    var i = +c.dataset.i;
    if (i !== cf.i){ e.preventDefault(); go(i); return; }
    var b = e.target.closest('[data-notify]'); if (b) notify(b.dataset.notify);
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function(en){ cf.vis = en[0].isIntersecting; }, {threshold:.15}).observe(cfBox);

  /* "Get notified" jumps to the contact form with a ready-made message */
  function notify(title){
    var ta = $('#contactForm [name=message]'), msg = 'Please notify me when ' + title + ' launches.';
    if (!ta.value.trim() || /^Please notify me when /.test(ta.value)) ta.value = msg;
    if (location.hash !== '#contact') location.hash = 'contact'; else $('#contact').scrollIntoView({behavior: reduce ? 'auto' : 'smooth'});
    setTimeout(function(){ try { $('#contactForm [name=name]').focus({preventScroll:true}); } catch(e){} }, 700);
  }

  /* ---------- contact: copy buttons and the message form ---------- */
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    var text = b.dataset.copy === 'email' ? String(C('contact.email')||'') : String(C('contact.phone')||'');
    function done(ok){ toast(ok ? 'Copied ' + text : 'Press and hold to copy ' + text); }
    function fallback(){
      var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch(x){} t.remove(); done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){ done(true); }, fallback); else fallback();
  });

  var form = $('#contactForm'), formMsg = $('#formMsg');
  function say(t, ok){ formMsg.textContent = t; formMsg.className = 'form-msg ' + (ok ? 'ok' : 'err'); }
  function fieldErr(el, t){ say(t, false); el.setAttribute('aria-invalid', 'true'); el.focus(); }
  form.addEventListener('input', function(e){ e.target.removeAttribute && e.target.removeAttribute('aria-invalid'); });
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var fName = form.querySelector('[name=name]'), fContact = form.querySelector('[name=contact]'), fMsg = form.querySelector('[name=message]'), fHp = form.querySelector('[name=website]');
    var name = fName.value.trim(), contact = fContact.value.trim(), message = fMsg.value.trim();
    $$('[aria-invalid]', form).forEach(function(x){ x.removeAttribute('aria-invalid'); });
    if (fHp.value){ say(C('contact.success'), true); form.reset(); return; }
    if (!name) return fieldErr(fName, 'Please enter your name.');
    if (!contact) return fieldErr(fContact, 'Please enter an email address or phone number.');
    var isMail = U.isEmail(contact);
    if (!isMail && !U.isPhone(contact)) return fieldErr(fContact, 'That does not look like an email address or phone number.');
    if (!message) return fieldErr(fMsg, 'Please write a short message.');
    var m = { id: Date.now().toString(36) + Math.random().toString(36).slice(2,7), name: name, contact: contact, kind: isMail ? 'email' : 'phone', message: message, ts: new Date().toISOString(), read: false };
    if (!TG.messages.add(m)) return say('Your message could not be saved in this browser. Please email us directly.', false);
    var fwd = U.safeHref(C('contact.forwardUrl'));
    if (/^https:/i.test(fwd) && window.fetch){
      try { fetch(fwd, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify({ name:name, contact:contact, message:message }) }).catch(function(){}); } catch(x){}
    }
    say(C('contact.success'), true); form.reset();
  });

  /* ---------- 3D tilt (cards + glass scenes), delegated so new pages work ---------- */
  if (!reduce && window.matchMedia('(hover:hover)').matches){
    var tiltEl = null, sceneEl = null;
    document.addEventListener('pointermove', function(e){
      var t = e.target.closest ? e.target.closest('[data-tilt]') : null;
      if (tiltEl && tiltEl !== t) tiltEl.style.transform = '';
      tiltEl = t;
      if (t && !t.classList.contains('rv')){
        var r = t.getBoundingClientRect(), x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
        t.style.transform = 'perspective(800px) rotateX(' + (-y*9).toFixed(2) + 'deg) rotateY(' + (x*11).toFixed(2) + 'deg) translateY(-3px)';
      }
      var sc = e.target.closest ? e.target.closest('.scene') : null;
      if (sceneEl && sceneEl !== sc){ sceneEl.style.setProperty('--ry','0deg'); sceneEl.style.setProperty('--rx','0deg'); }
      sceneEl = sc;
      if (sc){
        var q = sc.getBoundingClientRect(), a = (e.clientX - q.left)/q.width - .5, b = (e.clientY - q.top)/q.height - .5;
        sc.style.setProperty('--ry', (a*26).toFixed(1) + 'deg'); sc.style.setProperty('--rx', (-b*18).toFixed(1) + 'deg');
      }
    }, {passive:true});
  }

  /* ---------- pointer-follow glass highlight ---------- */
  if (window.matchMedia('(hover:hover)').matches){
    var GLASS = '.panel,.card,.proj,.row,.quote,.pager a,.work-links a,details,.nav-in,.hchip,.cf-card';
    document.addEventListener('pointermove', function(e){
      var el = e.target.closest ? e.target.closest(GLASS) : null;
      while (el){
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px'); el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
        el = el.parentElement ? el.parentElement.closest(GLASS) : null;
      }
    }, {passive:true});
  }

  /* ---------- count-up ---------- */
  var counted = false, countIO = null;
  function countUp(){
    if (counted) return; counted = true;
    $$('[data-count]').forEach(function(el){
      var end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
      function step(t){ var p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,3); el.textContent = Math.round(end*e) + suf; if (p<1) requestAnimationFrame(step); }
      if (!reduce) requestAnimationFrame(step);
    });
  }
  function watchCount(){
    if (!('IntersectionObserver' in window)) return;
    if (countIO) countIO.disconnect();
    countIO = new IntersectionObserver(function(en,ob){ en.forEach(function(x){ if(x.isIntersecting){ countUp(); ob.disconnect(); } }); }, {threshold:.4});
    countIO.observe($('#stats'));
  }

  /* ---------- 3D logo (layered WebGL object built from the logo image) ---------- */
  var scenes = [];
  function layout3d(){ scenes.forEach(function(s){ s.layout(); }); }
  function init3D(){
    var mouse = {x:0,y:0,tx:0,ty:0};
    addEventListener('pointermove', function(e){ mouse.tx = e.clientX/innerWidth*2-1; mouse.ty = e.clientY/innerHeight*2-1; }, {passive:true});
    var small = innerWidth < 700, Z = 9, FOV = 35, SIZE = 4.4;

    function loadTex(src){ return new Promise(function(res){ var im = new Image(); im.onload = function(){ var t = new THREE.Texture(im); t.anisotropy = 4; t.needsUpdate = true; res(t); }; im.onerror = function(){ res(null); }; im.src = src; }); }

    function makeScene(canvas, o, T){
      var renderer;
      try { renderer = new THREE.WebGLRenderer({canvas:canvas, alpha:true, antialias:true, powerPreference:'low-power'}); } catch(err){ return null; }
      renderer.setClearColor(0x000000, 0);
      var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FOV,1,.1,60); camera.position.z = Z;
      var group = new THREE.Group(); scene.add(group);
      var geo = new THREE.PlaneGeometry(SIZE,SIZE), N = o.layers, depth = o.depth, front = null;
      for (var i=0;i<N;i++){
        var f = i/(N-1), isFront = i === N-1;
        var m = new THREE.MeshBasicMaterial({map: isFront ? ((isLightTheme() && T.fullLight) ? T.fullLight : T.full) : T.notext, transparent:true, depthWrite:false, depthTest:false});
        var shade = .42 + .58*Math.pow(f,1.2); m.color.setRGB(shade, shade, shade);
        var mesh = new THREE.Mesh(geo, m); mesh.position.z = -depth/2 + depth*f; mesh.renderOrder = i; group.add(mesh);
        if (isFront) front = m;
      }
      var s = { canvas:canvas, visible:true, base:{x:0,y:0,s:1}, time:0 };
      s.layout = function(){
        var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, small ? 1.5 : 2)); renderer.setSize(w,h,false);
        camera.aspect = w/h; camera.updateProjectionMatrix();
        var visH = 2*Z*Math.tan(FOV*Math.PI/360), visW = visH*camera.aspect, tg = o.target(w,h);
        s.base.s = (tg.pw/w*visW)/SIZE; s.base.x = (tg.cx/w-.5)*visW; s.base.y = -(tg.cy/h-.5)*visH;
        group.scale.setScalar(s.base.s); group.position.x = s.base.x; group.position.y = s.base.y;
        s.render(s.time);
      };
      s.setTheme = function(light){ front.map = (light && T.fullLight) ? T.fullLight : T.full; front.needsUpdate = true; s.render(s.time); };
      s.render = function(t){
        s.time = t;
        if (!reduce){
          group.rotation.y = Math.sin(t*.5)*.7 + mouse.x*.32*o.parallax;
          group.rotation.x = -.1 + Math.sin(t*.35)*.1 + mouse.y*.2*o.parallax;
          group.rotation.z = Math.sin(t*.27)*.05;
          group.position.y = s.base.y + Math.sin(t*.9)*.08*s.base.s;
        } else { group.rotation.set(-.1,.3,0); }
        renderer.render(scene, camera);
      };
      if ('ResizeObserver' in window){ var ro = new ResizeObserver(s.layout); ro.observe(canvas); if (o.watch) ro.observe(o.watch); } else addEventListener('resize', s.layout);
      new IntersectionObserver(function(en){ s.visible = en[0].isIntersecting; }, {rootMargin:'120px'}).observe(canvas);
      s.layout(); scenes.push(s); return s;
    }

    Promise.all([loadTex(IMG.full), loadTex(IMG.notext), loadTex(IMG.fullLight)]).then(function(T){
      if (!T[0] || !T[1]) return;
      var tex = {full:T[0], notext:T[1], fullLight:T[2]};
      var heroCanvas = $('#heroCanvas'), stage = $('#heroStage');
      makeScene(heroCanvas, {parallax:1, layers: small?24:44, depth: small?.8:1.15, watch:stage, target:function(w,h){
        var cr = heroCanvas.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        return { cx: sr.left - cr.left + sr.width/2, cy: sr.top - cr.top + sr.height*.5, pw: Math.min(sr.width*1.3, sr.height*1.32) };
      }}, tex);
      makeScene($('#aboutCanvas'), {parallax:.4, layers:small?14:26, depth:.9, target:function(w,h){ return {cx:w/2, cy:h*.5, pw:Math.min(w*1.15, h*1.3)}; }}, tex);
      (function frame(ts){
        requestAnimationFrame(frame);
        mouse.x += (mouse.tx-mouse.x)*.05; mouse.y += (mouse.ty-mouse.y)*.05;
        if (reduce) return;
        for (var i=0;i<scenes.length;i++){ if (scenes[i].visible) scenes[i].render(ts/1000); }
      })(0);
    });
  }
  if (window.THREE) init3D();

  /* ---------- theme (light / dark) ---------- */
  var root = document.documentElement, themeBtn = $('#themeToggle'), mqLight = window.matchMedia('(prefers-color-scheme: light)');
  function currentTheme(){ var t = root.dataset.theme; return (t === 'light' || t === 'dark') ? t : (mqLight.matches ? 'light' : 'dark'); }
  function isLightTheme(){ return currentTheme() === 'light'; }
  function syncTheme(){
    var t = currentTheme();
    themeBtn.dataset.mode = t;
    themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    scenes.forEach(function(s){ if (s.setTheme) s.setTheme(t === 'light'); });
  }
  themeBtn.addEventListener('click', function(){
    var t = currentTheme() === 'light' ? 'dark' : 'light';
    root.dataset.theme = t;
    try { localStorage.setItem('tg-theme', t); } catch(e){}
  });
  new MutationObserver(syncTheme).observe(root, {attributes:true, attributeFilter:['data-theme']});
  if (mqLight.addEventListener) mqLight.addEventListener('change', syncTheme);
  syncTheme();

  addEventListener('load', function(){ layout3d(); });

  /* ---------- go ---------- */
  applyContent();
  watchCount();
  carState();
  TG.on(function(){ applyContent(); carState(); });
  route();
})();
