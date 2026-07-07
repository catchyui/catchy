/**
 * Catchy  Head Merge Module
 *
 * Merges incoming <head> metadata, styles, links, and scripts from SPA responses.
 */

import { decodeBase64Utf8 } from './utils.js';

/**
 * Merges head metadata from incoming document to current document.
 * Handles meta tags (by name/property/http-equiv), link tags (by href), and style tags.
 *
 * @param {HTMLHeadElement} incomingHead
 */
export function mergeHead(incomingHead) {
 if (!incomingHead) return;

 mergeMetaTags(incomingHead);
 mergeLinkTags(incomingHead);
 mergeStyleTags(incomingHead);
}

/**
 * Merge head content from base64-encoded X-Catchy-Head header.
 * Parses the HTML fragment and merges relevant elements.
 *
 * @param {string} base64Head - Base64-encoded head HTML content
 */
export function mergeHeadFromHeader(base64Head) {
 if (!base64Head) return;

 const headHtml = decodeBase64Utf8(base64Head);
 if (!headHtml) return;

 const parser = new DOMParser();
 const doc = parser.parseFromString(`<head>${headHtml}</head>`, 'text/html');
 if (doc.head) {
 mergeHead(doc.head);
 }
}

/**
 * Merge meta tags from incoming head into the current document head.
 *
 * @param {HTMLHeadElement} incomingHead
 */
function mergeMetaTags(incomingHead) {
 const currentMetaTags = Array.from(document.head.querySelectorAll('meta'));
 const incomingMetaTags = Array.from(incomingHead.querySelectorAll('meta'));

 incomingMetaTags.forEach(incomingMeta => {
 const name = incomingMeta.getAttribute('name');
 const property = incomingMeta.getAttribute('property');
 const httpEquiv = incomingMeta.getAttribute('http-equiv');

 let existingMeta = null;
 if (name) {
 existingMeta = currentMetaTags.find(m => m.getAttribute('name') === name);
 } else if (property) {
 existingMeta = currentMetaTags.find(m => m.getAttribute('property') === property);
 } else if (httpEquiv) {
 existingMeta = currentMetaTags.find(m => m.getAttribute('http-equiv') === httpEquiv);
 }

 if (existingMeta) {
 if (existingMeta.getAttribute('content') !== incomingMeta.getAttribute('content')) {
 existingMeta.setAttribute('content', incomingMeta.getAttribute('content'));
 }
 } else {
 document.head.appendChild(incomingMeta.cloneNode(true));
 }
 });
}

/**
 * Merge link tags (stylesheets, fonts, canonical, etc.) from incoming head.
 *
 * @param {HTMLHeadElement} incomingHead
 */
function mergeLinkTags(incomingHead) {
 const currentLinks = Array.from(document.head.querySelectorAll('link'));
 const incomingLinks = Array.from(incomingHead.querySelectorAll('link'));

 incomingLinks.forEach(incomingLink => {
 const href = incomingLink.getAttribute('href');
 const rel = incomingLink.getAttribute('rel');

 if (rel === 'canonical') {
 // Replace existing canonical link
 const existingCanonical = currentLinks.find(l => l.getAttribute('rel') === 'canonical');
 if (existingCanonical) {
 existingCanonical.setAttribute('href', href);
 } else {
 document.head.appendChild(incomingLink.cloneNode(true));
 }
 } else if (href) {
 const exists = currentLinks.some(l => l.getAttribute('href') === href && l.getAttribute('rel') === rel);
 if (!exists) {
 document.head.appendChild(incomingLink.cloneNode(true));
 }
 }
 });
}

/**
 * Merge style tags from incoming head (by data-catchy-style-id or content hash).
 *
 * @param {HTMLHeadElement} incomingHead
 */
function mergeStyleTags(incomingHead) {
 const incomingStyles = Array.from(incomingHead.querySelectorAll('style'));

 incomingStyles.forEach(incomingStyle => {
 const styleId = incomingStyle.getAttribute('data-catchy-style-id');
 if (styleId) {
 // Replace by ID
 const existing = document.head.querySelector(`style[data-catchy-style-id="${styleId}"]`);
 if (existing) {
 existing.textContent = incomingStyle.textContent;
 } else {
 document.head.appendChild(incomingStyle.cloneNode(true));
 }
 }
 // Skip anonymous styles to avoid duplicates
 });
}
