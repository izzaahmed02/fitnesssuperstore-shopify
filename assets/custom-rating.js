document.addEventListener("DOMContentLoaded", function () {
	initStarRatings();
});

function initStarRatings() {
	const ratingContainers = document.querySelectorAll(".homepage-hero__rating-stars");
	ratingContainers.forEach(container => {
		const ratingValue = parseFloat(container.dataset.ratiing);
		if (isNaN(ratingValue)) return;

		fillStars(container, ratingValue);
	});
}

function fillStars(container, ratingValue) {
	const rating = Math.max(0, Math.min(5, ratingValue));

	const stars = container.querySelectorAll("svg");
	stars.forEach((starSVG, index) => {
		let starFraction = rating - index;
		if (starFraction < 0) starFraction = 0;
		if (starFraction > 1) starFraction = 1;

		const path = starSVG.querySelector("path");
		if (!path) return;


		if (starFraction === 1) {
			path.setAttribute("fill", "#FFC107");
			return;
		}

		if (starFraction === 0) {
			path.setAttribute("fill", "none");
			return;
		}

		const defs = starSVG.querySelector("defs") || createDefs(starSVG);
		const gradId = "partialGrad-" + index + "-" + Date.now();

		const linearGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
		linearGrad.setAttribute("id", gradId);
		linearGrad.setAttribute("x1", "0");
		linearGrad.setAttribute("y1", "0");
		linearGrad.setAttribute("x2", "1");
		linearGrad.setAttribute("y2", "0");

		const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		stop1.setAttribute("offset", (starFraction * 100) + "%");
		stop1.setAttribute("stop-color", "#FFC107");

		const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		stop2.setAttribute("offset", (starFraction * 100) + "%");
		stop2.setAttribute("stop-color", "transparent");

		linearGrad.appendChild(stop1);
		linearGrad.appendChild(stop2);
		defs.appendChild(linearGrad);

		path.setAttribute("fill", `url(#${gradId})`);
	});
}

function createDefs(svg) {
	const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
	svg.insertBefore(defs, svg.firstChild);
	return defs;
}

