class GymDesignerSlider {
  constructor() {
    this.slider = document.querySelector('.gym-designer-slider');
    this.slides = document.querySelectorAll('.gym-designer-slide');
    this.dotsContainer = document.querySelector('.gym-designer-dots');
    this.currentSlide = 0;
    this.autoplayInterval = 5000; // 5 seconds between slides
    this.autoplayTimer = null;

    if (this.slider && this.slides.length > 0) {
      this.init();
    }
  }

  init() {
    // Create dots
    this.slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('dot');
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.addEventListener('click', () => this.goToSlide(index));
      this.dotsContainer.appendChild(dot);
    });

    this.dots = this.dotsContainer.querySelectorAll('.dot');
    
    // Show first slide
    this.showSlide(0);
    
    // Start autoplay
    this.startAutoplay();

    // Pause autoplay on hover
    this.slider.addEventListener('mouseenter', () => this.stopAutoplay());
    this.slider.addEventListener('mouseleave', () => this.startAutoplay());
  }

  showSlide(index) {
    // Hide all slides
    this.slides.forEach(slide => {
      slide.classList.remove('active');
      slide.setAttribute('aria-hidden', 'true');
    });

    // Remove active class from all dots
    this.dots.forEach(dot => dot.classList.remove('active'));

    // Show current slide
    this.slides[index].classList.add('active');
    this.slides[index].setAttribute('aria-hidden', 'false');
    this.dots[index].classList.add('active');
    
    this.currentSlide = index;
  }

  goToSlide(index) {
    this.showSlide(index);
    this.stopAutoplay();
    this.startAutoplay();
  }

  nextSlide() {
    const next = (this.currentSlide + 1) % this.slides.length;
    this.showSlide(next);
  }

  startAutoplay() {
    if (this.autoplayTimer) return;
    this.autoplayTimer = setInterval(() => this.nextSlide(), this.autoplayInterval);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
}

// Initialize slider when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GymDesignerSlider();
}); 