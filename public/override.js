/* Chargé après le script principal */
document.addEventListener('DOMContentLoaded', ()=>{
  // 1) Forcer l'utilisation des logos locaux dans la LISTE
  if (typeof window !== 'undefined') {
    window.logoNode = function(domain, company, _fallback, logoUrl){
      const box=document.createElement('div'); box.className='logo2';
      const img=document.createElement('img'); img.className='logo-img';
      const local = (window.LOCAL_LOGOS && window.LOCAL_LOGOS[company]) ? window.LOCAL_LOGOS[company] : null;
      const src = logoUrl || local || (domain && window.logoURL ? window.logoURL(domain) : null) || window.GENERIC_LOGO;
      img.src = src; img.alt = company || 'logo'; img.loading='lazy'; img.referrerPolicy='no-referrer';
      box.appendChild(img); return box;
    };

    // 2) Limiter l'affichage à 10 cartes + bouton "Voir plus" en bas de la colonne gauche
    const ORIG_RENDER = window.render;
    let page = 1, PAGE_SIZE = 10;
    window.render = function(){
      ORIG_RENDER && ORIG_RENDER();

      // masquer > 10 * page
      const cards = Array.from(document.querySelectorAll('#groups .card'));
      cards.forEach((el,i)=>{ el.style.display = (i < page*PAGE_SIZE) ? '' : 'none'; });

      // déplacer la vitrine après la 3e carte visible si elle existe
      const list = document.querySelector('#groups .list');
      const showcase = document.querySelector('#groups .showcase');
      if (list && showcase){
        const visible = cards.filter(el => el.style.display !== 'none');
        if (visible[3]) list.insertBefore(showcase, visible[3].nextSibling);
      }

      // bouton "Voir plus"
      let btn = document.getElementById('seeMore');
      if (!btn){
        btn = document.createElement('button');
        btn.id = 'seeMore';
        btn.className = 'see-more';
        btn.textContent = "Voir plus d’annonces";
        document.getElementById('groups')?.appendChild(btn);
        btn.addEventListener('click', ()=>{ page++; window.render(); });
      }
      btn.style.display = (cards.length > page*PAGE_SIZE) ? '' : 'none';
    };
  }
});
