(function () {
	'use strict';

	class AccordionManager {
		constructor() {
			this.accordionHeaders = document.querySelectorAll('.accordion-header');
		}

		init() {
			if (!this.accordionHeaders.length) return;

			this.accordionHeaders.forEach(header => {
				const content = header.nextElementSibling;
				if (!content) return;

				const links = content.querySelectorAll('a');
				const isExpanded = header.getAttribute('aria-expanded') === 'true';

				this.setAccordionState(header, content, links, isExpanded);
				this.attachEventListeners(header, content, links);
			});
		}

		setAccordionState(header, content, links, isExpanded) {
			header.setAttribute('aria-expanded', String(isExpanded));

			if (isExpanded) {
				content.style.maxHeight = content.scrollHeight + 'px';
				content.setAttribute('aria-hidden', 'false');
			} else {
				content.style.maxHeight = '0';
				content.setAttribute('aria-hidden', 'true');
			}

			links.forEach(link => {
				link.setAttribute('tabindex', isExpanded ? '0' : '-1');
			});
		}

		toggleAccordion(header, content, links) {
			const isExpanded = header.getAttribute('aria-expanded') === 'true';
			this.setAccordionState(header, content, links, !isExpanded);
		}

		attachEventListeners(header, content, links) {
			header.addEventListener('click', () => {
				this.toggleAccordion(header, content, links);
			});

			header.addEventListener('keydown', (event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					this.toggleAccordion(header, content, links);
				}
			});
		}
	}

	document.addEventListener('DOMContentLoaded', function () {
		const accordionManager = new AccordionManager();
		accordionManager.init();
	});
})();