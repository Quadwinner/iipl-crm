/**
 * Opens a signed file URL in a way popup blockers allow.
 *
 * `window.open` is only permitted while the browser still considers itself
 * inside the click that triggered it. Minting a signed URL is asynchronous, so
 * calling `window.open` after awaiting it is outside that window and Chrome,
 * Safari and Firefox all block it — the file silently never opens.
 *
 * Opening a blank tab synchronously on the click keeps the permission, and its
 * location is set once the URL arrives. If the mint fails the tab is closed
 * again rather than left sitting on about:blank.
 */
export async function openSignedFile<T extends { signedUrl: string }>(
  mint: () => Promise<T>,
): Promise<T> {
  const tab = window.open('', '_blank', 'noopener,noreferrer')

  try {
    const file = await mint()
    if (tab) tab.location.href = file.signedUrl
    // A blocked or unavailable tab is not a failure worth throwing over: fall
    // back to navigating this one, which needs no popup permission.
    else window.location.href = file.signedUrl
    return file
  } catch (cause) {
    tab?.close()
    throw cause
  }
}
