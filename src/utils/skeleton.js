// Generates skeleton placeholder HTML
// Usage: showSkeleton('dashboard-root', 3) - shows 3 skeleton cards
//        hideSkeleton('dashboard-root') - removes skeletons

export function showSkeleton(containerId, count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const skeletons = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>
  `).join('');

  container.innerHTML = skeletons;
}

export function hideSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
}// Generates skeleton placeholder HTML
// Usage: showSkeleton('dashboard-root', 3) - shows 3 skeleton cards
//        hideSkeleton('dashboard-root') - removes skeletons

export function showSkeleton(containerId, count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const skeletons = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>
  `).join('');

  container.innerHTML = skeletons;
}

export function hideSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
}