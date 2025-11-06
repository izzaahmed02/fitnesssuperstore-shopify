const onReady=e=>"loading"===document.readyState?document.addEventListener("DOMContentLoaded",e,{once:!0}):e(),onIdle=(e,t=1500)=>"requestIdleCallback"in window?requestIdleCallback(e,{timeout:t}):setTimeout(e,0),debounceFn=(e,t=250)=>{let l;return(...i)=>{clearTimeout(l),l=setTimeout(()=>e(...i),t)}},rafBatch=(()=>{let e=!1,t=[],l=()=>{let l=t;for(let i of(t=[],e=!1,l))i()};return i=>{t.push(i),e||(e=!0,requestAnimationFrame(l))}})();async function getDistanceFromBenicia(e){try{let t=await fetch(`https://french-fitness-api.azurewebsites.net/api/location/distancefrombenicia/${encodeURIComponent(e)}`,{credentials:"omit"});return t.ok?await t.json():null}catch{return null}}async function loadPricingReferenceHTML(){let e=window.pricingReferenceHtml,t=await fetch(e,{cache:"force-cache"});return t.text()}onReady(()=>{onIdle(()=>{let e=document.querySelector(".compare-products-actions a");e&&e.removeAttribute("href")}),document.addEventListener("click",e=>{let t=e.target.closest(".faq .faq__item-btn");if(!t)return;let l=t.closest(".faq__item"),i=t.closest(".faq");if(!l||!i)return;let s=l.querySelector(".faq__item-content"),o=!t.classList.contains("opened");i.querySelectorAll(".faq__item-btn.opened").forEach(e=>e.classList.remove("opened")),i.querySelectorAll(".faq__item.opened").forEach(e=>e.classList.remove("opened")),i.querySelectorAll(".faq__item-content").forEach(e=>e.style.maxHeight=null),o&&(t.classList.add("opened"),l.classList.add("opened"),rafBatch(()=>{s.style.overflow="hidden",s.style.transition||(s.style.transition="max-height 0.3s ease"),s.style.maxHeight=s.scrollHeight+"px"}))},{passive:!0});let e=new ResizeObserver(e=>{e.forEach(({target:e})=>{let t=e.closest(".faq__item"),l=t&&t.querySelector(".faq__item-btn.opened");l&&(e.style.maxHeight=e.scrollHeight+"px")})});document.querySelectorAll(".faq__item-content").forEach(t=>{t.style.overflow="hidden",t.style.transition||(t.style.transition="max-height 0.3s ease"),t.style.maxHeight="0",e.observe(t)}),document.addEventListener("click",e=>{let t=e.target.closest("[data-tabs-section] .tab-btn");if(!t)return;let l=t.closest("[data-tabs-section]"),i=t.getAttribute("data-index"),s=l&&l.querySelector(`.tabs__item[data-index="${i}"]`);l&&s&&rafBatch(()=>{l.querySelectorAll(".tab-btn.active").forEach(e=>e.classList.remove("active")),t.classList.add("active"),l.querySelectorAll(".tabs__item.active, .tabs__item.visible").forEach(e=>e.classList.remove("active","visible")),s.classList.add("active","visible")})},{passive:!0});let t=(e,t,l)=>{rafBatch(()=>{let i=l??!e.classList.contains("visible");e.classList.toggle("visible",i),e.style.height=i?`${e.scrollHeight}px`:"0",t&&(t.style.transform=i?"rotate(180deg)":"rotate(0deg)")})};if(document.body.addEventListener("click",e=>{let l=e.target.closest(".dropdown-btn");if(l&&window.innerWidth<=749){let i=l.nextElementSibling;i&&t(i,l.querySelector("svg"));return}let s=e.target.closest(".image-with-text__dropdown-button");if(s){let o=s.nextElementSibling;o&&t(o,s.querySelector("svg"))}},{passive:!0}),document.addEventListener("click",e=>{let t=e.target.closest("[data-scroll-to-section]");if(!t)return;let l=t.getAttribute("data-scroll-to-section"),i=l&&document.getElementById(l);i&&(e.preventDefault(),i.scrollIntoView({behavior:"smooth",block:"start"}))},{passive:!1}),!customElements.get("scrollable-faq")){class l extends HTMLElement{constructor(){super(),this.buttons=this.querySelectorAll(".scrollable-faq__nav button"),this.blocks=Array.from(this.querySelectorAll(".scrollable-faq__item")),this.activeClass="active",this.offset=50,this.mq=matchMedia("(min-width: 750px)"),this.onMQ=this.onMQ.bind(this),this.io=null}connectedCallback(){this.mq.addEventListener("change",this.onMQ),this.onMQ(this.mq)}disconnectedCallback(){this.mq.removeEventListener("change",this.onMQ),this.io&&this.io.disconnect()}onMQ(e){this.buttons.forEach(e=>e.replaceWith(e.cloneNode(!0))),this.buttons=this.querySelectorAll(".scrollable-faq__nav button"),this.io&&this.io.disconnect(),this.io=null,e.matches&&(this.buttons.forEach(e=>e.addEventListener("click",()=>this.scrollToId(e.getAttribute("data-scroll-to")),{passive:!0})),this.io=new IntersectionObserver(e=>{let t=null;e.forEach(e=>{e.isIntersecting&&(t=e.target.id)}),t&&this.setActive(t)},{rootMargin:"-50px 0px -30% 0px",threshold:.2}),this.blocks.forEach(e=>this.io.observe(e)))}scrollToId(e){let t=e&&document.getElementById(e);if(!t)return;let l=t.getBoundingClientRect().top+scrollY-this.offset;scrollTo({top:l,behavior:"smooth"})}setActive(e){this.buttons.forEach(t=>t.classList.toggle(this.activeClass,t.getAttribute("data-scroll-to")===e))}}customElements.define("scrollable-faq",l)}document.body.addEventListener("click",e=>{let l=e.target.closest("[data-scroll-to-mobile]");if(!l||window.innerWidth>749)return;let i=l.getAttribute("data-scroll-to-mobile"),s=i&&document.getElementById(i);s&&t(s,l.querySelector(".scrollable-faq__arrow"))},{passive:!0}),document.addEventListener("click",e=>{e.target.closest(".button.globo-formbuilder-open")&&(document.body.style.overflow="hidden"),e.target.closest(".header.dismiss")&&(document.body.style.overflow="auto")},{passive:!0}),document.body.addEventListener("click",e=>{let t=e.target.closest(".accordion-item");if(!t)return;let l=t.nextElementSibling;if(!l)return;let i=t.querySelector(".icon-plus"),s=t.querySelector(".icon-minus"),o=t.querySelector(".arrow"),r=!l.classList.contains("visible");rafBatch(()=>{l.classList.toggle("visible",r),l.style.height=r?`${l.scrollHeight}px`:"0",i&&s&&(i.style.display=r?"none":"block",s.style.display=r?"block":"none"),o&&(o.style.transform=r?"rotate(180deg)":"rotate(0deg)")})},{passive:!0});let i=()=>{document.querySelectorAll(".faq__item.opened .faq__item-content").forEach(e=>e.style.height=`${e.scrollHeight}px`),document.querySelectorAll(".visible").forEach(e=>{"hidden"===getComputedStyle(e).overflowY&&(e.style.height=`${e.scrollHeight}px`)})};addEventListener("resize",debounceFn(()=>rafBatch(i),150),{passive:!0});let s=document.querySelector('a[href="#pricing-reference"]');s&&s.addEventListener("click",async e=>{e.preventDefault();let t=document.getElementById("dynamic-product-content"),l=document.querySelector(".modal-wrapper");if(!t||!l)return;let i=document.createElement("div");i.innerHTML=await loadPricingReferenceHTML(),t.innerHTML=i.innerHTML+`
        <span class="modal-close">
          <svg aria-hidden="true" focusable="false" width="12" height="13" class="icon icon-close-small" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.48627 9.32917L2.82849 3.67098" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.88539 9.38504L8.42932 3.61524" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>`;

      modalWrapper.style.display = 'flex';
      document.documentElement.style.overflowY = 'hidden';

      const closeBtn = container.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modalWrapper.style.display = 'none';
          document.documentElement.style.overflowY = '';
        }, { once: true });
      }
    }, { passive: false });
  }

  const search = document.querySelector('.custom-header-search--input');
  const hidePopup = (p) => { if (p) p.style.display = 'none'; };
  const outsideClose = (ev) => {
    const popup = document.getElementById('ui-id-1');
    if (!popup) return;
    if (!popup.contains(ev.target) && (!search || !search.contains(ev.target))) hidePopup(popup);
  };
  document.addEventListener('click', outsideClose, true);
  if (search) {
    search.addEventListener('input', debounceFn(() => {
      const popup = document.getElementById('ui-id-1');
      if (search.value.trim()) return;
      hidePopup(popup);
      search.blur(); document.body.focus();
    }, 150));
  }

  document.addEventListener('click', (e) => {
    const thumb = e.target.closest('.video-thumbnail');
    if (!thumb) return;
    const url = thumb.getAttribute('data-video-url');
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('modalVideoContainer');
    if (!url || !modal || !container) return;

    let embed;
    if (/youtube\.com|youtu\.be/.test(url)) {
      const id = (url.split(/v=|\/([^\/\?]+)$/).filter(Boolean).pop() || '').trim();
      embed = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" height="450" width="550" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else {
      embed = `<video controls autoplay src="${url}"></video>`;
    }
    container.innerHTML = embed;
    modal.style.display = 'flex';
  }, { passive: true });

  window.closeModal = function(){
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('modalVideoContainer');
    if (container) container.innerHTML = '';
    if (modal) modal.style.display = 'none';
  };

});

(() => {
  const mainBlocks = document.querySelectorAll('.info-grid__item.grid__item .link-style');
  const contentSections = document.querySelectorAll('.feature-block-container.content-section');
  if (!mainBlocks.length || !contentSections.length) return;

  const isMobile = () => innerWidth <= 750;

  const moveSectionsToMain = () => {
    mainBlocks.forEach((block) => {
      const id = block.getAttribute('data-target');
      const section = id && document.getElementById(id);
      if (!section) return;
      if (isMobile()) {
        if (block.previousElementSibling !== section) block.before(section);
      } else {
        const original = document.querySelector(`.container-${id}`);
        if (original && !original.contains(section)) original.appendChild(section);
      }
    });
  };

  const toggleSectionVisibility = (id) => {
    const section = id && document.getElementById(id);
    const btn = document.querySelector(`[data-target="${id}"]`);
    if (!section || !btn) return;
    const opening = !section.classList.contains('active');
    rafBatch(() => {
      section.classList.toggle('active', opening);
      section.style.maxHeight = opening ? '2500px' : '0';
      btn.classList.toggle('active', opening);
      const span = btn.querySelector('span'); if (span) span.textContent = opening ? 'Show less' : 'Learn more';
    });
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.info-grid__item.grid__item .link-style');
    if (!btn) return;
    const id = btn.getAttribute('data-target');
    const section = id && document.getElementById(id);
    if (!section) return;

    e.preventDefault();
    if (isMobile()) {
      toggleSectionVisibility(id);
    } else {
      section.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    }
  }, { passive: false });

  moveSectionsToMain();
  addEventListener('resize', debounceFn(() => rafBatch(moveSectionsToMain), 150), { passive: true });
})();

async function loadPricingReferenceHTML() {
  const url = window.pricingReferenceHtml
  const res = await fetch(url, { cache: 'force-cache' });
  return res.text();
}
