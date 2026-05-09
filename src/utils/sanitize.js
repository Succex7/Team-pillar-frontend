import DOMPurify from 'dompurify';

export function sanitize(dirty) {
  return DOMPurify.sanitize(dirty);
}

export function setHTML(element, html) {
  element.innerHTML = sanitize(html);
}