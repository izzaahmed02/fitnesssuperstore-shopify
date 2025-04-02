(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		const accordionHeaders = document.querySelectorAll('.accordion-header');
		if (!accordionHeaders.length) return;

		accordionHeaders.forEach((header) => {
			const content = header.nextElementSibling;
			if (!content) return;
			const initiallyExpanded = header.getAttribute('aria-expanded') === 'true';
			const links = content.querySelectorAll('a');
			links.forEach(link => {
				link.setAttribute('tabindex', initiallyExpanded ? '0' : '-1');
			});

			header.addEventListener('click', function () {
				const isExpanded = this.getAttribute('aria-expanded') === 'true';
				this.setAttribute('aria-expanded', String(!isExpanded));

				if (!isExpanded) {
					content.style.maxHeight = '100%';
					content.setAttribute('aria-hidden', 'false');
					links.forEach(link => {
						link.setAttribute('tabindex', '0');
					});
				} else {
					content.style.maxHeight = 0;
					content.setAttribute('aria-hidden', 'true');
					links.forEach(link => {
						link.setAttribute('tabindex', '-1');
					});
				}
			});
		});
	});
})();

