window.addEventListener('DOMContentLoaded', async () => {
	let faqItems = document.querySelectorAll('.faq__item');
	if (faqItems.length) {
		faqItems.forEach((item) => {
			let contentELem = item.querySelector('.faq__item-content');
			let btn = item.querySelector('.faq__item-btn');

			btn.addEventListener('click', () => {
				if (!btn.classList.contains('opened')) {
					btn.classList.add('opened');
					let height = contentELem.scrollHeight;
					contentELem.style.height = `${height}px`;
				} else {
					btn.classList.remove('opened');
					contentELem.style.height = '0px';
				}
				item.classList.toggle('opened');
			})
		})
	}

	let tabsSections = document.querySelectorAll('[data-tabs-section]');

	if (tabsSections.length) {
		tabsSections.forEach((section) => {
			const btns = section.querySelectorAll('.tab-btn');
			const tabs = section.querySelectorAll('.tabs__item');

			btns.forEach((btn) => {
				btn.addEventListener('click', () => {
					let index = btn.getAttribute('data-index');
					let activeTab = section.querySelector(`.tabs__item[data-index="${index}"]`);

					if (activeTab) {
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
	if (scrollToSectionBtns.length) {
		scrollToSectionBtns.forEach((btn) => {
			let id = btn.getAttribute('data-scroll-to-section');
			let section = document.querySelector(`#${id}`);

			btn.addEventListener('click', () => {
				if (section) {
					section.scrollIntoView({behavior: "smooth", block: "start"});
				}
			});
		});
	}

	class ScrollableFaq extends HTMLElement {
		constructor() {
			super();
			this.buttons = this.querySelectorAll('.scrollable-faq__nav button');
			this.contentBlocks = Array.from(this.querySelectorAll('.scrollable-faq__item'));
			this.activeClass = 'active';
			this.offset = 50;
			this.mediaQuery = window.matchMedia('(min-width: 750px)');
			this.handleMediaChange = this.handleMediaChange.bind(this);
			this.observer = null;
			this.init();
		}

		init() {
			this.mediaQuery.addEventListener('change', this.handleMediaChange);
			this.handleMediaChange(this.mediaQuery);
		}

		handleMediaChange(e) {
			if (e.matches) {
				this.buttons.forEach(btn => {
					const id = btn.getAttribute('data-scroll-to');
					btn.addEventListener('click', () => this.scrollToElement(id));
				});

				this.setupObserver();
			} else {
				this.buttons.forEach(btn => {
					const id = btn.getAttribute('data-scroll-to');
					btn.removeEventListener('click', () => this.scrollToElement(id));
				});

				if (this.observer) {
					this.observer.disconnect();
					this.observer = null;
				}
			}
		}

		scrollToElement(id) {
			const element = document.querySelector(`#${id}`);
			if (element) {
				const offsetTop = element.getBoundingClientRect().top + window.scrollY - this.offset;
				window.scrollTo({
					top: offsetTop,
					behavior: 'smooth'
				});
			}
		}

		setupObserver() {
			if (this.observer) {
				this.observer.disconnect();
			}
			this.observer = new IntersectionObserver((entries) => {
				let activeId = null;
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
					}
				});
				if (activeId) {
					this.setActiveButton(activeId);
				}
			}, {
				root: null,
				rootMargin: `-50px 0px -30% 0px`,
				threshold: 0.2
			});
			this.contentBlocks.forEach(block => this.observer.observe(block));
		}

		setActiveButton(activeId) {
			this.buttons.forEach(btn => {
				if (btn.getAttribute('data-scroll-to') === activeId) {
					btn.classList.add(this.activeClass);
				} else {
					btn.classList.remove(this.activeClass);
				}
			});
		}

		disconnectedCallback() {
			this.mediaQuery.removeEventListener('change', this.handleMediaChange);
			if (this.observer) {
				this.observer.disconnect();
			}
		}
	}

	customElements.define('scrollable-faq', ScrollableFaq);
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

	document.addEventListener('click', (e) => {
		const btn = e.target.closest('.button.globo-formbuilder-open');
		if (btn) {
			document.body.style.overflow = 'hidden';
		}
		const closeBtn = e.target.closest('.header.dismiss');
		if (closeBtn) {
			document.body.style.overflow = 'auto';
		}
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
			console.log('here')
			modalWrapper.style.display = 'flex';
			document.querySelector('html').style.overflowY = 'hidden';
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
				document.querySelector('html').style.overflowY = '';
			});
		})
	}

	if (!sessionStorage.userLoc) {
		const locationRes = await fetch("https://french-fitness-api.azurewebsites.net/api/location");
		if (locationRes) {
			const userLoc = await locationRes.json();
			sessionStorage.userLoc = JSON.stringify(userLoc);
			if (userLoc && userLoc.country_code === 'US') {
				const distanceFromBenicia = await getDistanceFromBenicia(userLoc.postal)
				if (distanceFromBenicia <= 100) {
					document.querySelector('.utility-bar').style.display = 'block';
				}
			}
		}
	} else {
		const userLocFromSessionStorage = JSON.parse(sessionStorage.userLoc);

		if (userLocFromSessionStorage && userLocFromSessionStorage.country_code === 'US') {
			const distanceFromBenicia = await getDistanceFromBenicia(userLocFromSessionStorage.postal);

			if (distanceFromBenicia <= 100) {
				document.querySelector('.utility-bar').style.display = 'block';
			}
		}
	}
});

async function getDistanceFromBenicia(postal) {
	try {
		const res = await fetch(`https://french-fitness-api.azurewebsites.net/api/location/distancefrombenicia/${postal}`);
		return await res.json();
	} catch (err) {
		console.error(err);
		return null;
	}
}

function debounce(func, timeout = 250) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(this, args);
		}, timeout);
	};
}


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
					section.scrollIntoView({behavior: "smooth", block: "start", inline: "start"});
				}
			});
		});
	}
};

const initializeScrolling = () => {
	if (mainBlocks.length && contentSections.length) {
		if (isMobile()) {
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


