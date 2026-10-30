(function(){
  'use strict';
  const form=document.getElementById('guestbookForm');
  if(!form||window.JesslynGuestbook)return;
  const byId=id=>document.getElementById(id);
  const endpoint=form.dataset.api.replace(/\/$/,'');
  const nameInput=byId('fNama'),messageInput=byId('fUcapan'),attendanceInput=byId('fHadir');
  const list=byId('wishList'),count=byId('wishCount'),status=byId('wishStatus'),feedStatus=byId('wishFeedStatus');
  const more=byId('wishMore'),refresh=byId('wishRefresh'),submit=byId('sendWish');
  const tokenKey='jesslyn-ultah-guestbook-session-v1';
  let token='',sessionPromise=null,items=[],nextCursor=null,busy=false;
  const requests=new WeakMap();
  const dateFormat=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Makassar'});
  const timeFormat=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Makassar'});
  try{token=localStorage.getItem(tokenKey)||'';}catch(error){}
  function inform(element,text,error){element.textContent=text;element.dataset.error=error?'true':'false';}
  function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
  function uuid(){return crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(20)),x=>x.toString(16).padStart(2,'0')).join('');}
  async function request(path,options,retry){
    options=options||{};
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
    try{
      const headers={'Content-Type':'application/json'};
      if(token)headers.Authorization='Bearer '+token;
      const response=await fetch(endpoint+path,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined,signal:controller.signal,credentials:'omit',cache:'no-store'});
      let data;
      try{data=await response.json();}catch(error){throw Error('Buku ucapan belum tersambung. Silakan coba kembali.');}
      if(response.status===401&&retry!==false&&path!=='/session'){
        token='';await ensureSession();return request(path,options,false);
      }
      if(!response.ok)throw Error(data.error||'Ucapan belum dapat diproses. Silakan coba kembali.');
      return data;
    }catch(error){
      if(error.name==='AbortError'||error instanceof TypeError)throw Error('Koneksi terputus. Periksa internet, lalu coba lagi.');
      throw error;
    }finally{clearTimeout(timer);}
  }
  async function ensureSession(){
    if(sessionPromise)return sessionPromise;
    sessionPromise=request('/session',{method:'POST',body:{}},false).then(data=>{
      token=data.token;try{localStorage.setItem(tokenKey,token);}catch(error){}return token;
    }).finally(()=>{sessionPromise=null;});
    return sessionPromise;
  }
  function badgeFor(attendance){
    if(attendance==='Hadir')return ['✓ Hadir','hadir'];
    if(attendance==='Hadir (bersama keluarga)')return ['✓ Bersama keluarga','hadir'];
    if(attendance==='Mohon maaf, tidak dapat hadir')return ['× Tidak Hadir','tidak'];
    return ['◷ Belum pasti','belum'];
  }
  function makeReplyForm(parent){
    const replyForm=element('form','gb-reply-form');replyForm.hidden=true;replyForm.id='reply-form-'+parent.id;
    const labelName=element('label',null,'Nama Anda'),replyName=element('input');
    replyName.type='text';replyName.required=true;replyName.maxLength=160;replyName.autocomplete='name';replyName.value=nameInput.value;
    labelName.append(replyName);
    const labelMessage=element('label',null,'Balasan untuk '+parent.name),replyMessage=element('textarea');
    replyMessage.required=true;replyMessage.maxLength=1000;replyMessage.rows=3;labelMessage.append(replyMessage);
    const button=element('button','gb-reply-send','Kirim Balasan');button.type='submit';
    const replyStatus=element('p','gb-status');replyStatus.setAttribute('role','status');replyStatus.setAttribute('aria-live','polite');
    replyForm.append(labelName,labelMessage,button,replyStatus);
    for(const input of [replyName,replyMessage])input.addEventListener('input',()=>input.setCustomValidity(''));
    replyForm.addEventListener('submit',async event=>{
      event.preventDefault();
      const name=replyName.value.trim(),message=replyMessage.value.trim();
      if(!name||!message){const field=!name?replyName:replyMessage;field.setCustomValidity(!name?'Isi nama Anda.':'Isi balasan terlebih dahulu.');field.reportValidity();return;}
      const payload={name,message,attendance:attendanceInput.value,parentId:parent.id,company:''};
      const item=await send(replyForm,payload,button,replyStatus);
      if(item){parent.replies=parent.replies||[];parent.replies.push(item);parent.replyCount=(parent.replyCount||0)+1;render();inform(status,'Balasan berhasil ditampilkan di undangan.');}
    });
    return replyForm;
  }
  function entry(item,isReply){
    const article=element('article','gb-entry'+(isReply?' gb-is-reply':''));article.dataset.wishId=String(item.id);
    const head=element('div','gb-entry-head'),name=element('h4','gb-name',item.name);
    const badgeData=badgeFor(item.attendance),badge=element('span','gb-badge',badgeData[0]);badge.dataset.state=badgeData[1];
    head.append(name,badge);
    const message=element('p','gb-message',item.message),foot=element('div','gb-entry-foot');
    const time=element('time','gb-time');time.dateTime=item.createdAt;
    const created=new Date(item.createdAt);time.append(element('span',null,dateFormat.format(created)),element('span',null,timeFormat.format(created)+' WITA'));
    const actions=element('div','gb-actions'),heart=element('button','gb-text-button gb-like');heart.type='button';
    heart.setAttribute('aria-label','Sukai ucapan dari '+item.name);heart.setAttribute('aria-pressed',String(item.liked));
    heart.append(element('span','gb-heart',item.liked?'♥':'♡'),element('span',null,String(item.likes||0)));
    heart.addEventListener('click',async()=>{
      heart.disabled=true;
      try{await ensureSession();const data=await request('/wishes/'+item.id+'/reaction',{method:'PUT',body:{liked:!item.liked}});item.liked=data.item.liked;item.likes=data.item.likes;heart.setAttribute('aria-pressed',String(item.liked));heart.firstChild.textContent=item.liked?'♥':'♡';heart.lastChild.textContent=String(item.likes);inform(feedStatus,'');}
      catch(error){inform(feedStatus,error.message,true);}finally{heart.disabled=false;}
    });
    let replyForm;
    if(!isReply){
      replyForm=makeReplyForm(item);
      const reply=element('button','gb-text-button','Balas'+(item.replyCount?' ('+item.replyCount+')':''));reply.type='button';reply.setAttribute('aria-expanded','false');reply.setAttribute('aria-controls',replyForm.id);
      reply.addEventListener('click',()=>{replyForm.hidden=!replyForm.hidden;reply.setAttribute('aria-expanded',String(!replyForm.hidden));if(!replyForm.hidden)replyForm.querySelector('textarea').focus();});
      actions.append(reply);
    }
    actions.append(heart);
    if(item.own){
      const remove=element('button','gb-text-button gb-delete','Hapus');remove.type='button';remove.setAttribute('aria-label','Hapus ucapan saya');
      remove.addEventListener('click',async()=>{
        if(!window.confirm('Hapus ucapan ini dari undangan?'))return;
        remove.disabled=true;
        try{await ensureSession();await request('/wishes/'+item.id,{method:'DELETE'});if(isReply){for(const root of items){root.replies=(root.replies||[]).filter(r=>r.id!==item.id);root.replyCount=root.replies.length;}render();}else await loadPage(false);inform(feedStatus,'Ucapan telah dihapus.');}
        catch(error){inform(feedStatus,error.message,true);remove.disabled=false;}
      });actions.append(remove);
    }
    foot.append(time,actions);article.append(head,message,foot);if(replyForm)article.append(replyForm);
    if(!isReply&&item.replies&&item.replies.length){
      const replies=element('div','gb-replies');for(const reply of item.replies)replies.append(entry(reply,true));
      if(item.replyCount>item.replies.length)replies.append(element('p','gb-replies-note','Menampilkan 30 balasan terbaru.'));
      article.append(replies);
    }
    return article;
  }
  function render(){
    list.replaceChildren();
    if(!items.length)list.append(element('p','gb-empty','Belum ada ucapan. Jadilah yang pertama mengirimkan doa untuk Jesslyn.'));
    for(const item of items)list.append(entry(item,false));
    more.hidden=!nextCursor;
  }
  async function loadPage(append){
    if(busy)return false;busy=true;refresh.disabled=true;more.disabled=true;list.setAttribute('aria-busy','true');
    try{
      const data=await request('/wishes'+(append&&nextCursor?'?before='+nextCursor:''));
      items=append?items.concat(data.items):data.items;nextCursor=data.nextCursor;
      count.textContent=new Intl.NumberFormat('id-ID').format(data.total)+' ucapan';render();inform(feedStatus,'');return true;
    }catch(error){
      if(!items.length){list.replaceChildren(element('p','gb-empty','Daftar ucapan belum dapat dimuat.'))}inform(feedStatus,error.message,true);return false;
    }finally{busy=false;refresh.disabled=false;more.disabled=false;list.setAttribute('aria-busy','false');}
  }
  async function send(target,payload,button,targetStatus){
    if(button.disabled)return null;
    const fingerprint=JSON.stringify(payload);let pending=requests.get(target);
    if(!pending||pending.fingerprint!==fingerprint){pending={fingerprint,requestId:uuid()};requests.set(target,pending);}
    const oldLabel=button.textContent;button.disabled=true;button.textContent='Mengirim…';inform(targetStatus,'Sedang mengirim ucapan…');
    try{
      await ensureSession();const data=await request('/wishes',{method:'POST',body:Object.assign({},payload,{requestId:pending.requestId})});
      requests.delete(target);inform(targetStatus,'Terima kasih. Ucapan Anda sudah tampil di undangan.');return data.item;
    }catch(error){inform(targetStatus,error.message,true);return null;}
    finally{button.disabled=false;button.textContent=oldLabel;}
  }
  for(const input of [nameInput,messageInput])input.addEventListener('input',()=>input.setCustomValidity(''));
  const charCount=()=>{byId('wishChars').textContent=messageInput.value.length+' / 1.000';};messageInput.addEventListener('input',charCount);
  form.addEventListener('submit',async event=>{
    event.preventDefault();const name=nameInput.value.trim(),message=messageInput.value.trim();
    if(!name||!message){const input=!name?nameInput:messageInput;input.setCustomValidity(!name?'Isi nama tamu atau keluarga.':'Tuliskan ucapan dan doa Anda.');input.reportValidity();return;}
    const item=await send(form,{name,message,attendance:attendanceInput.value,parentId:null,company:byId('wishCompany').value},submit,status);
    if(item){messageInput.value='';charCount();await loadPage(false);list.scrollIntoView({behavior:'smooth',block:'start'});}
  });
  const picker=byId('wishEmojiPicker'),toggle=byId('wishEmojiToggle');
  toggle.addEventListener('click',()=>{picker.hidden=!picker.hidden;toggle.setAttribute('aria-expanded',String(!picker.hidden));});
  picker.addEventListener('click',event=>{const choice=event.target.closest('button[data-emoji]');if(!choice)return;const emoji=choice.dataset.emoji;if(messageInput.value.length+emoji.length>1000)return;messageInput.setRangeText(emoji,messageInput.selectionStart,messageInput.selectionEnd,'end');messageInput.setCustomValidity('');charCount();messageInput.focus();});
  refresh.addEventListener('click',()=>loadPage(false));more.addEventListener('click',()=>loadPage(true));
  const queryName=(new URLSearchParams(location.search).get('to')||'').trim();if(queryName&&!nameInput.value)nameInput.value=queryName.slice(0,160);
  window.JesslynGuestbook={refresh:()=>loadPage(false)};
  charCount();
  ensureSession().catch(()=>{}).then(()=>loadPage(false));
  setInterval(()=>{if(!document.hidden&&!busy&&items.length<=10&&!list.querySelector('.gb-reply-form:not([hidden])'))loadPage(false);},30000);
})();
