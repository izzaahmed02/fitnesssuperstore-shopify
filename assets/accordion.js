(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		const accordionHeaders = document.querySelectorAll('.accordion-header');
		if (!accordionHeaders || accordionHeaders.length === 0) return;

		accordionHeaders.forEach(function (header) {
			header.addEventListener('click', function () {
				const isExpanded = this.getAttribute('aria-expanded') === 'true';
				this.setAttribute('aria-expanded', String(!isExpanded));
				const content = this.nextElementSibling;
				if (!content) return;
				content.setAttribute('aria-hidden', String(isExpanded));

				if (!isExpanded) {
					content.style.maxHeight = '100%';
				} else {
					content.style.maxHeight = 0;
				}
			});
		});
	});
})();

