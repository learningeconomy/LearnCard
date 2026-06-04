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

const de_profile_notifications = /** @type {(inputs: Profile_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benachrichtigungen`)
};

const ar_profile_notifications = /** @type {(inputs: Profile_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إشعارات`)
};

const fr_profile_notifications = /** @type {(inputs: Profile_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const ko_profile_notifications = /** @type {(inputs: Profile_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`알림`)
};

/**
* | output |
* | --- |
* | "Notifications" |
*
* @param {Profile_NotificationsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_notifications = /** @type {((inputs?: Profile_NotificationsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_NotificationsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_notifications(inputs)
	if (locale === "es") return es_profile_notifications(inputs)
	if (locale === "de") return de_profile_notifications(inputs)
	if (locale === "ar") return ar_profile_notifications(inputs)
	if (locale === "fr") return fr_profile_notifications(inputs)
	return ko_profile_notifications(inputs)
});
export { profile_notifications as "profile.notifications" }