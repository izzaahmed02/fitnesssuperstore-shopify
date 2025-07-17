$('.browse-brand .category-tab-content').slick({
  dots: true,
  infinite: true,
  draggable: true,
  cssEase: 'linear',
  swipeToSlide: true,   
  touchThreshold: 8,  
  slidesToShow: 5,
  slidesToScroll: 1,
   responsive: [
      { breakpoint: 1300, settings: { slidesToShow: 4 }},
      { breakpoint: 1024, settings: { slidesToShow: 3 }},
      { breakpoint: 989,  settings: { slidesToShow: 2 }}
    ]
});
	