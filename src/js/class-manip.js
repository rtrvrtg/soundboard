// @file
// Module for DOM class manipulation.
// @see https://jaketrent.com/post/addremove-classes-raw-javascript/
// @flow

let classManip = {};

classManip.hasClass = function(el: HTMLElement, className: string): boolean {
  if (el.classList) {
    return el.classList.contains(className)
  }
  else {
    return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
  }
}

classManip.addClass = function(el: HTMLElement, className: string): void {
  if (el.classList) {
    el.classList.add(className)
  }
  else if (!hasClass(el, className)) {
    el.className += " " + className
  }
}

classManip.removeClass = function(el: HTMLElement, className: string): void {
  if (el.classList) {
    el.classList.remove(className)
  }
  else if (hasClass(el, className)) {
    var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
    el.className = el.className.replace(reg, ' ');
  }
}

module.exports = classManip;
