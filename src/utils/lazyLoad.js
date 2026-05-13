// Lazy loads images using Intersection Observer API
// Usage: lazyLoadImages() — call once per page after DOM renders

export function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    images.forEach((img) => observer.observe(img));
  } else {
    // Fallback for old browsers
    images.forEach((img) => {
      img.src = img.dataset.src;
    });
  }
}