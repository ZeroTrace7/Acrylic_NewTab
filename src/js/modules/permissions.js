/**
 * modules/permissions.js — Runtime permission helpers for optional MV3 permissions.
 *
 * Acrylic uses optional_permissions for 'tabs' to avoid the
 * "Read your browsing history" install warning. These helpers
 * gate tab-dependent features behind user-initiated runtime requests.
 */

/**
 * Checks whether the 'tabs' permission has already been granted.
 * @returns {Promise<boolean>}
 */
export async function hasTabsPermission() {
  try {
    return await chrome.permissions.contains({ permissions: ['tabs'] });
  } catch {
    return false;
  }
}

/**
 * Requests the 'tabs' permission via the MV3 runtime prompt.
 * MUST be called from a direct user-gesture event handler (click, keydown)
 * or Chrome will silently reject the request.
 * @returns {Promise<boolean>} true if the user granted the permission
 */
export async function requestTabsPermission() {
  try {
    return await chrome.permissions.request({ permissions: ['tabs'] });
  } catch {
    return false;
  }
}
