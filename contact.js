(() => {
  const toast=document.querySelector('.copy-toast');
  let toastTimer;
  const buttonTimers=new WeakMap();
  function notify(title,value){clearTimeout(toastTimer);toast.querySelector('.toast-heading').textContent=title;toast.querySelector('.toast-value').textContent=value;toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),4500)}
  async function copy(value){
    try{await navigator.clipboard.writeText(value);return true}catch{
      const input=document.createElement('textarea');input.value=value;input.style.cssText='position:fixed;left:-9999px';document.body.append(input);input.select();let success=false;try{success=document.execCommand('copy')}catch{}input.remove();return success;
    }
  }
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const success=await copy(button.dataset.copy);
    if(!success){notify('Не удалось скопировать. Скопируйте вручную:',button.dataset.copy);toast.style.pointerEvents='auto';return}
    toast.style.pointerEvents='none';clearTimeout(buttonTimers.get(button));button.classList.add('copied');button.querySelector('.card-label').textContent='Скопировано';notify(`${button.dataset.kind} скопирован`,button.dataset.copy);
    buttonTimers.set(button,setTimeout(()=>{button.classList.remove('copied');button.querySelector('.card-label').textContent=button.dataset.kind},2600));
  }));
  const callback=document.querySelector('#callback');
  document.querySelector('.form-jump[href="#callback"]')?.addEventListener('click',event=>{
    event.preventDefault();history.replaceState(null,'','#callback');callback.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    callback.querySelector('h2').focus({preventScroll:true});
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)callback.querySelectorAll('h2,.callback-form').forEach((el,i)=>el.animate([{opacity:.2,transform:'translateY(35px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay:150+i*100,easing:'cubic-bezier(.16,1,.3,1)'}));
  });
  document.querySelector('.callback-form')?.addEventListener('submit',event=>{
    event.preventDefault();const data=new FormData(event.currentTarget);
    const body=`Имя: ${data.get('firstName')} ${data.get('lastName')}\nТелефон: ${data.get('phone')}\nEmail: ${data.get('email')}\nКомпания: ${data.get('company')}\n\n${data.get('message')}`;
    location.href=`mailto:art@3darstudio.ru?subject=${encodeURIComponent('Заявка на обратный звонок — 3DAR')}&body=${encodeURIComponent(body)}`;
    document.querySelector('.form-status').textContent='Отправьте подготовленное письмо из вашего почтового приложения. Если оно не открылось, свяжитесь со студией по контактам выше.';
  });
})();
