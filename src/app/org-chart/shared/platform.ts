/** The iOS test must be first, because iPad and iPhone user agents contain "Mac OS X". */
export const PRIMARY_MODIFIER_KEY_LABEL = (() => {
  if (typeof navigator === 'undefined') return 'Ctrl';
  const ua = navigator.userAgent;
  return !/iPhone|iPad|iPod/.test(ua) && /Mac/.test(ua) ? 'Cmd' : 'Ctrl';
})();
