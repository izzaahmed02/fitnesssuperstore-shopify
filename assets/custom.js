window.addEventListener('DOMContentLoaded', () => {
  // FAQ
  let faqItems = document.querySelectorAll('.faq__item');

  if(faqItems.length){
      faqItems.forEach((item)=>{
          let contentELem = item.querySelector('.faq__item-content'); 
          let btn = item.querySelector('.faq__item-btn'); 

          btn.addEventListener('click',()=>{
              if(!btn.classList.contains('opened')){
                btn.classList.add('opened');
                let height = contentELem.scrollHeight;
                contentELem.style.height = `${height}px`;
              }else{
                  btn.classList.remove('opened');
                  contentELem.style.height = '0px';
              }

              item.classList.toggle('opened');
          })
      })
  }

  // TABS SECTION
  let tabsSections = document.querySelectorAll('[data-tabs-section]');
  
  if(tabsSections.length){
      tabsSections.forEach((section)=>{
          const btns = section.querySelectorAll('.tab-btn');
          const tabs = section.querySelectorAll('.tabs__item');

          btns.forEach((btn)=>{
              btn.addEventListener('click',()=>{
                  let index = btn.getAttribute('data-index');
                  let activeTab = section.querySelector(`.tabs__item[data-index="${index}"]`);

                  if(activeTab){
                      btns.forEach(button => button.classList.remove('active'));
                      btn.classList.add('active');

                      tabs.forEach(tab => tab.classList.remove('active'));
                      activeTab.classList.add('active');

                      tabs.forEach(tab => tab.classList.remove('visible'));
                      activeTab.classList.add('visible');
                  }
              })
          })
      })
  }

  // MOBILE DROPDOWNS (Event Delegation)
  document.body.addEventListener('click', (e) => {
      const dropdownBtn = e.target.closest('.dropdown-btn');
      if (dropdownBtn && window.innerWidth <= 749) {
          const section = dropdownBtn.nextElementSibling;
          if (section) {
              const isVisible = section.classList.contains('visible');
              const arrow = dropdownBtn.querySelector('svg');
              
              if (!isVisible) {
                  section.classList.add('visible');
                  section.style.height = `${section.scrollHeight}px`;
                  if (arrow) arrow.style.transform = 'rotate(180deg)';
              } else {
                  section.classList.remove('visible');
                  section.style.height = '0';
                  if (arrow) arrow.style.transform = 'rotate(0deg)';
              }
          }
      }
  });

  // IMAGE WITH TEXT DROPDOWNS
  document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.image-with-text__dropdown-button');
      if (btn) {
          const section = btn.nextElementSibling;
          if (section) {
              const isVisible = section.classList.contains('visible');
              const arrow = btn.querySelector('svg');
              
              if (!isVisible) {
                  section.classList.add('visible');
                  section.style.height = `${section.scrollHeight}px`;
                  if (arrow) arrow.style.transform = 'rotate(180deg)';
              } else {
                  section.classList.remove('visible');
                  section.style.height = '0';
                  if (arrow) arrow.style.transform = 'rotate(0deg)';
              }
          }
      }
  });

  // SCROLL TO SECTION
  let scrollToSectionBtns = document.querySelectorAll('[data-scroll-to-section]');

  if(scrollToSectionBtns.length){
      scrollToSectionBtns.forEach((btn)=>{
          let id = btn.getAttribute('data-scroll-to-section');
          let section = document.querySelector(`#${id}`);

          btn.addEventListener('click',()=>{
             if(section){
              section.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
             }
          })
      })
  }

  class ScrollableFaq extends HTMLElement {  
      constructor() {
          super();
          this.buttons = this.querySelectorAll('.scrollable-faq__nav button');
          this.contentBlocks = this.querySelectorAll('.scrollable-faq__item');
          this.activeClass = 'active';
          this.offset = -10;
          this.mediaQuery = window.matchMedia('(min-width: 750px)');
          this.handleMediaChange = this.handleMediaChange.bind(this);
          this.init();
      }

      init(){
          this.mediaQuery.addListener(this.handleMediaChange);
          this.handleMediaChange(this.mediaQuery);
      }

      handleMediaChange(e) {
          if (e.matches) {
              this.buttons.forEach(btn => {
                  const id = btn.getAttribute('data-scroll-to');
                  btn.addEventListener('click', () => this.scrollToElement(id));
              });
              window.addEventListener('scroll', this.handleScroll);
          } else {
              this.buttons.forEach(btn => {
                  const id = btn.getAttribute('data-scroll-to');
                  btn.removeEventListener('click', () => this.scrollToElement(id));
              });
              window.removeEventListener('scroll', this.handleScroll);
          }
      }

      scrollToElement(id) {
          const element = document.querySelector(`#${id}`);
          if (element) {
              const elementTop = element.getBoundingClientRect().top + window.scrollY;
              window.scrollTo({
                  top: elementTop - this.offset,
                  behavior: 'smooth'
              });
          }
      }

      handleScroll = () => {
          if (window.innerWidth <= 749) return;
          const scrollPosition = window.scrollY + this.offset;
          this.contentBlocks.forEach((block, index) => {
              const blockTop = block.offsetTop;
              const blockBottom = blockTop + block.offsetHeight;
              if (scrollPosition >= (blockTop - 50) && scrollPosition < blockBottom) {
                  this.setActiveButton(index);
              }
          });
      }

      setActiveButton(activeIndex) {
          this.buttons.forEach(btn => btn.classList.remove(this.activeClass));
          this.buttons[activeIndex].classList.add(this.activeClass);
      }

      disconnectedCallback() {
          this.mediaQuery.removeListener(this.handleMediaChange);
          window.removeEventListener('scroll', this.handleScroll);
      }
  }

  customElements.define("scrollable-faq", ScrollableFaq);

  // MOBILE SCROLL TO SECTION (Event Delegation)
  document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-scroll-to-mobile]');
      if (btn && window.innerWidth <= 749) {
          const id = btn.getAttribute('data-scroll-to-mobile');
          const section = document.querySelector(`#${id}`);
          if (section) {
              const isVisible = section.classList.contains('visible');
              const arrow = btn.querySelector('.scrollable-faq__arrow');
              
              if (!isVisible) {
                  section.classList.add('visible');
                  section.style.height = `${section.scrollHeight}px`;
                  if (arrow) arrow.style.transform = 'rotate(180deg)';
              } else {
                  section.classList.remove('visible');
                  section.style.height = '0';
                  if (arrow) arrow.style.transform = 'rotate(0deg)';
              }
          }
      }
  });

  // Calculate order form (body scrolling prevent)
  const calculateButtons = document.querySelectorAll('.button.globo-formbuilder-open');
  calculateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
          document.body.style.overflow = 'hidden';
          const closeCalculateFormBtn = document.querySelector('.header.dismiss');
          if (closeCalculateFormBtn) {
              closeCalculateFormBtn.addEventListener('click', () => {
                  document.body.style.overflow = 'auto';
              }, { once: true });
          }
      });
  });

  const link = document.getElementById('paytomorrow-link');
  if (link) {
      link.addEventListener('click', (event) => {
          event.preventDefault(); 
          window.open(
              'https://api.paytomorrow.com/api/ecommerce/public/pre-approval/a4f00e481c4f3e28756375f86d272b22',
              '_blank',
              'location=yes,height=670,width=500,scrollbars=yes,status=yes'
          );
      });
  }

  // MENU MOBILE ACCORDION (Event Delegation)
  document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.accordion-item');
      if (btn) {
          const content = btn.nextElementSibling;
          if (content) {
              const isVisible = content.classList.contains('visible');
              const plus = btn.querySelector('.icon-plus');
              const minus = btn.querySelector('.icon-minus');
              const arrow = btn.querySelector('.arrow');
              
              if (!isVisible) {
                  content.classList.add('visible');
                  content.style.height = `${content.scrollHeight}px`;
                  if (plus && minus) {
                      plus.style.display = 'none';
                      minus.style.display = 'block';
                  } else if (arrow) {
                      arrow.style.transform = 'rotate(180deg)';
                  }
              } else {
                  content.classList.remove('visible');
                  content.style.height = '0';
                  if (plus && minus) {
                      plus.style.display = 'block';
                      minus.style.display = 'none';
                  } else if (arrow) {
                      arrow.style.transform = 'rotate(0deg)';
                  }
              }
          }
      }
  });

  // Update heights on resize for open elements
  function updateHeights() {
      document.querySelectorAll('.faq__item.opened .faq__item-content').forEach(content => {
          content.style.height = `${content.scrollHeight}px`;
      });
      document.querySelectorAll('.visible').forEach(section => {
          if (window.getComputedStyle(section).overflowY === 'hidden') {
              section.style.height = `${section.scrollHeight}px`;
          }
      });
  }

  const debouncedResize = debounce(updateHeights, 250);
  window.addEventListener('resize', debouncedResize);

  const pricingReferenceLink = document.querySelector('a[href="#pricing-reference"]');

  if (pricingReferenceLink) {
    pricingReferenceLink.addEventListener('click', (event) => {
        const container = document.getElementById('dynamic-product-content');
        const modalWrapper = document.querySelector('.modal-wrapper');
    
        modalWrapper.style.display = 'flex';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pricingRefenceModalContent;
        const mainContent = tempDiv;
        container.innerHTML = mainContent.innerHTML + `<span class="modal-close"><svg aria-hidden="true" focusable="false" width="12" height="13" class="icon icon-close-small" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.48627 9.32917L2.82849 3.67098" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2.88539 9.38504L8.42932 3.61524" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </span>`;
    
        const closeModalButton = container.querySelector('.modal-close');
    
        closeModalButton.addEventListener('click', () => {
            modalWrapper.style.display = 'none';
        });
      })
  }
});

function debounce(func, timeout = 250) {
  let timer;
  return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}


// GRID INFO BLOCKS SCROLLING LOGIC

const mainBlocks = document.querySelectorAll('.info-grid__item.grid__item .link-style');
const contentSections = document.querySelectorAll('.feature-block-container.content-section');

const isMobile = () => window.innerWidth <= 750;

const moveSectionsToMain = () => {
  if (mainBlocks.length && contentSections.length) {
    mainBlocks.forEach((block) => {
      const targetId = block.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);

      if (isMobile() && targetSection) {
        block.before(targetSection);
      } else {
        const originalContainer = document.querySelector(`.container-${targetId}`);
        if (originalContainer && !originalContainer.contains(targetSection)) {
          originalContainer.appendChild(targetSection);
        }
      }
    });
  }
};

const toggleSectionVisibility = (targetId) => {
  const targetSection = document.getElementById(targetId);

  if (targetSection) {
    const button = document.querySelector(`[data-target="${targetId}"]`);
    const isOpened = targetSection.classList.contains('active');

    if (!isOpened) {
      targetSection.classList.add('active');
      targetSection.style.maxHeight = '2500px';
      button?.classList.add('active');
      button.querySelector('span').textContent = "Show less";
    } else {
      targetSection.style.maxHeight = '0px';
      targetSection.classList.remove('active');
      button?.classList.remove('active');
      button.querySelector('span').textContent = "Learn more";
    }
  }
};

const enableDesktopScrolling = () => {
  if (mainBlocks.length) {
    mainBlocks.forEach((btn) => {
      const id = btn.getAttribute('data-target');
      const section = document.querySelector(`#${id}`);

      btn.addEventListener('click', (event) => {
        event.preventDefault();
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
        }
      });
    });
  }
};

const initializeScrolling = () => {
  if (mainBlocks.length && contentSections.length) {
    if (isMobile()) {
      // Mobile logic
      mainBlocks.forEach((block) => {
        block.addEventListener('click', (event) => {
          event.preventDefault();
          const targetId = block.getAttribute('data-target');
          toggleSectionVisibility(targetId);
        });
      });
      moveSectionsToMain();
      window.addEventListener('resize', moveSectionsToMain);
    } else {
      // Desktop logic
      enableDesktopScrolling();
    }
  }
};

initializeScrolling();
window.addEventListener('resize', initializeScrolling);

const pricingRefenceModalContent = `<div class="pricing-reference">
  <h1 class="pricing-title">REFERENCES ON PRICING</h1>

  <div class="pricing-section">
    <h2 class="region-title">
      Central America + South America (West Coast) + Mexico + Main Pacific Areas (Japan / Australia / China / Singapore / Guam / South Korea / Indonesia / Malaysia / Taiwan / Vietnam):
    </h2>
    <ul class="pricing-list">
      <li>1-5 Crates: <span>$424 to $1,799</span></li>
      <li>20' Container: <span>$1,999</span></li>
      <li>40' Container: <span>$2,499</span></li>
      <li>(2) 40' Containers: <span>$4,998</span></li>
      <li>(3) 40' Containers: <span>$7,497</span></li>
    </ul>
  </div>

  <div class="pricing-section">
    <h2 class="region-title">
      Caribbean Sea + South America (East Coast) + Pacific Islands + India:
    </h2>
    <ul class="pricing-list">
      <li>1-5 Crates: <span>$499 to $2,299</span></li>
      <li>20' Container: <span>$2,499</span></li>
      <li>40' Container: <span>$2,999</span></li>
      <li>(2) 40' Containers: <span>$5,998</span></li>
      <li>(3) 40' Containers: <span>$8,997</span></li>
    </ul>
  </div>

  <div class="pricing-section">
    <h2 class="region-title">
      Western Europe / Middle East / East Africa:
    </h2>
    <ul class="pricing-list">
      <li>1-5 Crates: <span>$574 to $2,799</span></li>
      <li>20' Container: <span>$2,999</span></li>
      <li>40' Container: <span>$3,499</span></li>
      <li>(2) 40' Containers: <span>$6,998</span></li>
      <li>(3) 40' Containers: <span>$10,997</span></li>
    </ul>
  </div>

  <div class="pricing-section">
    <h2 class="region-title">
      West Africa / Eastern-Northern Europe / Russia:
    </h2>
    <ul class="pricing-list">
      <li>1-5 Crates: <span>$624 to $2,299</span></li>
      <li>20' Container: <span>$3,499</span></li>
      <li>40' Container: <span>$3,999</span></li>
      <li>(2) 40' Containers: <span>$7,998</span></li>
      <li>(3) 40' Containers: <span>$11,997</span></li>
    </ul>
  </div>
</div>`
