document.addEventListener("DOMContentLoaded", () => {
	const brandLinks = document.querySelectorAll(".brand-item a");
	const categories = document.querySelectorAll(".brand-category");
	const container = document.querySelector(".brand-category-container");

	if (!brandLinks.length || !categories.length || !container) {
		console.error("Items not found");
		return;
	}

	brandLinks.forEach(link => {
		link.addEventListener("click", (event) => {
			event.preventDefault();
			const brandName = link.querySelector("span").textContent.trim();
			const targetCategory = [...categories].find(category =>
				category.querySelector("h3").textContent.trim() === brandName
			);
			if (!targetCategory) return;
			categories.forEach(category => {
				category.classList.add("hidden");
				setTimeout(() => {
					category.style.display = "none";
				}, 500);
			});
			setTimeout(() => {
				targetCategory.style.display = "block";
				setTimeout(() => {
					targetCategory.classList.remove("hidden");
				}, 50);
			}, 500);
			setTimeout(() => {
				const offset = document.querySelector('.brand-category-section').offsetTop;
				window.scrollTo({
					top: offset - 200,
					behavior: "smooth"
				});
			}, 300);
		});
	});
});