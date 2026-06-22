/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_NotificationsInputs */

const en_profile_notifications = /** @type {(inputs: Profile_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const es_profile_notifications = /** @type {(inputs: Profile_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notificaciones`)
};

const fr_profile_notifications = /** @type {(inputs: Profile_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const ar_profile_notifications = /** @type {(inputs: Profile_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إشعارات`)
};

/**
* | output |
* | --- |
* | "Notifications" |
*
* @param {Profile_NotificationsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_notifications = /** @type {((inputs?: Profile_NotificationsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_NotificationsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_notifications(inputs)
	if (locale === "es") return es_profile_notifications(inputs)
	if (locale === "fr") return fr_profile_notifications(inputs)
	return ar_profile_notifications(inputs)
});
export { profile_notifications as "profile.notifications" }