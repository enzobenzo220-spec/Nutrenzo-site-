/* Nutrenzo Web Studio — shared interactions */
(function(){
  document.documentElement.classList.add('js');
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  function store(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}

  /* header: shadow on scroll + mobile menu */
  var head=$('.site-head'),nav=$('#nav'),menu=$('#menu-btn');
  if(head){var onS=function(){head.classList.toggle('scrolled',window.scrollY>8)};window.addEventListener('scroll',onS,{passive:true});onS()}
  if(menu&&nav){menu.addEventListener('click',function(){var o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(o))})}

  /* before / after slider */
  $$('.ba').forEach(function(ba){
    var r=$('input',ba);if(!r)return;
    var set=function(){ba.style.setProperty('--pos',r.value+'%')};r.addEventListener('input',set);set();
  });

  /* FAQ accordions */
  $$('.faq-q').forEach(function(q){
    var a=document.getElementById(q.getAttribute('aria-controls'));
    q.addEventListener('click',function(){var o=q.getAttribute('aria-expanded')==='true';q.setAttribute('aria-expanded',String(!o));a.hidden=o});
  });

  /* case-study galleries */
  $$('.gallery').forEach(function(g){
    var tabs=$$('.g-tabs button',g),img=$('.browser img',g),cap=$('.g-cap',g),url=$('.browser .bar span',g);
    function pick(i){tabs.forEach(function(t,j){t.setAttribute('aria-selected',String(i===j))});var t=tabs[i];
      var n=img.cloneNode();n.src=t.dataset.src;n.alt=t.dataset.alt||'';img.replaceWith(n);img=n;cap.textContent=t.dataset.cap||'';if(url&&t.dataset.url)url.textContent=t.dataset.url}
    tabs.forEach(function(t,i){t.addEventListener('click',function(){pick(i)})});
    g.addEventListener('keydown',function(e){var k=tabs.indexOf(document.activeElement);if(k<0)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();var n=(k+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[n].focus();pick(n)}});
  });

  /* quote builder (pricing page) */
  var Q=$('#quote-data');
  if(Q){
    var D=JSON.parse(Q.textContent),state={pkg:'business',extra:0,add:{},care:false};
    var params=(location.hash||'').replace('#','');if(D.packages[params])state.pkg=params;
    var segBtns=$$('#q-pkg button'),addEls=$$('#q-addons .addon[data-id]'),careEl=$('#q-care');
    function money(n){return '$'+n.toLocaleString('en-US')}
    function calc(){
      var p=D.packages[state.pkg],total=p.price,lines=[[p.name,p.price]];
      if(state.extra){var c=state.extra*D.extraPage;total+=c;lines.push([state.extra+' extra page'+(state.extra>1?'s':''),c])}
      D.addons.forEach(function(a){
        if(state.add[a.id]&&p.includes.indexOf(a.id)<0){total+=a.price;lines.push([a.name,a.price])}
      });
      var weeks=p.weeks+(state.extra>2?1:0)-(state.add.rush?Math.max(p.weeks-1,0):0);
      return {p:p,total:total,lines:lines,weeks:Math.max(weeks,1)};
    }
    function render(){
      segBtns.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.pkg===state.pkg))});
      var p=D.packages[state.pkg];
      addEls.forEach(function(el){var id=el.dataset.id,inp=$('input',el),inc=p.includes.indexOf(id)>=0;
        el.classList.toggle('inc',inc);inp.disabled=inc;inp.checked=inc||!!state.add[id];
        $('.amt',el).textContent=inc?'Included':'+'+money(+el.dataset.price)});
      $('#q-extra').textContent=state.extra;
      var r=calc();
      $('#q-lines').innerHTML=r.lines.map(function(l){return '<div><dt>'+l[0]+'</dt><dd>'+money(l[1])+'</dd></div>'}).join('')+(state.care?'<div><dt>Care plan</dt><dd>'+money(D.care)+'/mo</dd></div>':'');
      $('#q-total').textContent=money(r.total);
      $('#q-deposit').textContent=money(Math.round(r.total/2));
      $('#q-weeks').textContent=r.weeks===1?'about 1 week':'about '+r.weeks+' weeks';
      var summary=r.lines.map(function(l){return l[0]}).join(', ')+(state.care?', Care plan':'')+' — estimate '+money(r.total);
      store('nz-quote',summary);
    }
    segBtns.forEach(function(b){b.addEventListener('click',function(){state.pkg=b.dataset.pkg;render()})});
    addEls.forEach(function(el){$('input',el).addEventListener('change',function(e){state.add[el.dataset.id]=e.target.checked;render()})});
    $('#q-minus').addEventListener('click',function(){state.extra=Math.max(0,state.extra-1);render()});
    $('#q-plus').addEventListener('click',function(){state.extra=Math.min(20,state.extra+1);render()});
    careEl.addEventListener('change',function(){state.care=careEl.checked;render()});
    $$('[data-pick]').forEach(function(a){a.addEventListener('click',function(){state.pkg=a.dataset.pick;render()})});
    render();
  }

  /* booking form → Web3Forms (free, emails the request to you) */
  var form=$('#book-form');
  if(form){
    var q=store('nz-quote');
    if(q){var note=$('#quote-note');note.hidden=false;$('#quote-text').textContent=q;$('#f-quote').value=q}
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var msg=$('#form-msg');msg.className='msg err';msg.textContent='';
      var need=[['f-name','your name'],['f-email','your email']];
      for(var i=0;i<need.length;i++){var f=$('#'+need[i][0]);if(!f.value.trim()){msg.textContent='Please add '+need[i][1]+'.';f.focus();return}}
      if(!/^\S+@\S+\.\S+$/.test($('#f-email').value)){msg.textContent='Please check your email address.';$('#f-email').focus();return}
      if($('#f-sms').checked&&!$('#f-phone').value.trim()){msg.textContent='Please add your mobile number so we can text you.';$('#f-phone').focus();return}
      var btn=$('button[type=submit]',form);btn.disabled=true;btn.textContent='Sending…';
      var key=$('input[name=access_key]',form).value;
      var live=/(^|\.)nutrenzo\.com$|\.github\.io$/.test(location.hostname)&&key&&key!=='YOUR_ACCESS_KEY';
      if(!live){setTimeout(function(){done(true)},500);return}
      var data={};new FormData(form).forEach(function(v,k){data[k]=data[k]?data[k]+', '+v:v});
      fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json()})
        .then(function(res){if(!res.success)throw new Error(res.message||'failed');done(false)})
        .catch(function(){btn.disabled=false;btn.textContent='Send request';msg.textContent='That didn’t send. Please try again, or call or text (440) 482-3276.'});
      function done(preview){
        form.hidden=true;var d=$('#form-done');d.hidden=false;
        $('#done-name').textContent=$('#f-name').value.trim().split(' ')[0];
        if(preview)$('#done-preview').hidden=false;
        d.scrollIntoView({behavior:'smooth',block:'center'});
      }
    });
  }

  var y=$('#yr');if(y)y.textContent=new Date().getFullYear();
})();

/* ===== Lead recovery: live demo + lost-revenue calculator ===== */
(function(){
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- demo --- */
  var demoData=$('#demo-data'),chat=$('#chat');
  if(demoData&&chat){
    var S=JSON.parse(demoData.textContent),tabs=$$('.demo-tabs button'),timers=[],cur=0;
    function clear(){timers.forEach(clearTimeout);timers=[];chat.innerHTML=''}
    function add(m){
      var el=document.createElement('div');
      if(m.speed){el.className='speed';el.textContent=m.speed}
      else{el.className='msg-b '+m.who+(m.tone?' '+m.tone:'');el.textContent=m.text}
      chat.appendChild(el);chat.scrollTop=chat.scrollHeight;
    }
    function typing(){var t=document.createElement('div');t.className='typing';t.innerHTML='<i></i><i></i><i></i>';chat.appendChild(t);chat.scrollTop=chat.scrollHeight;return t}
    function play(i,animate){
      cur=i;clear();
      tabs.forEach(function(b,j){b.setAttribute('aria-selected',String(i===j))});
      var sc=S[i];$('#demo-status').textContent=sc.status;
      if(!animate||reduce){sc.msgs.forEach(add);chat.scrollTop=0;return}
      var t=300;
      sc.msgs.forEach(function(m){
        if(m.who==='ai'&&!m.speed){
          (function(m,start){timers.push(setTimeout(function(){var ty=typing();timers.push(setTimeout(function(){ty.remove();add(m)},900))},start))})(m,t);
          t+=900+Math.min(1400,500+m.text.length*12);
        }else{
          (function(m,start){timers.push(setTimeout(function(){add(m)},start))})(m,t);
          t+=m.speed?250:(m.who==='lead'?1300:900);
        }
      });
    }
    tabs.forEach(function(b,i){b.addEventListener('click',function(){play(i,true)})});
    var rp=$('#demo-replay');if(rp)rp.addEventListener('click',function(){play(cur,true)});
    play(0,false);
    // play the first scenario live once the phone is on screen
    if('IntersectionObserver' in window&&!reduce){
      var seen=false,io=new IntersectionObserver(function(es){if(es[0].isIntersecting&&!seen){seen=true;setTimeout(function(){play(0,true)},500);io.disconnect()}},{threshold:.5});
      io.observe(chat);
    }
  }

  /* --- calculator --- */
  var calc=$('#calc');
  if(calc){
    var f=function(id){return +$('#'+id).value};
    var money=function(n){return '$'+Math.round(n).toLocaleString('en-US')};
    function run(){
      var inq=f('c-inq'),slow=f('c-slow')/100,close=f('c-close')/100,price=f('c-price'),stay=f('c-stay');
      $('#o-inq').textContent=inq;$('#o-slow').textContent=Math.round(slow*100)+'%';$('#o-close').textContent=Math.round(close*100)+'%';$('#o-price').textContent=money(price);$('#o-stay').textContent=stay+' mo';
      var lost=inq*slow,members=lost*close,monthly=members*price,life=monthly*stay;
      $('#r-leads').textContent=Math.round(lost);
      $('#r-members').textContent=members<1?members.toFixed(1):Math.round(members*10)/10;
      $('#r-month').textContent=money(monthly);
      $('#r-life').textContent=money(life);
      var plan=+calc.dataset.plan,need=price>0?Math.ceil(plan/price):0;
      $('#r-pay').textContent=need<=1?'one new member':need+' new members';
    }
    $$('input[type=range]',calc).forEach(function(r){r.addEventListener('input',run)});
    run();
  }
})();
