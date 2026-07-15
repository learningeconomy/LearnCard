/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Notifications1Inputs */

const en_userprofile_notifications1 = /** @type {(inputs: Userprofile_Notifications1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const es_userprofile_notifications1 = /** @type {(inputs: Userprofile_Notifications1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notificaciones`)
};

const fr_userprofile_notifications1 = /** @type {(inputs: Userprofile_Notifications1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const ar_userprofile_notifications1 = /** @type {(inputs: Userprofile_Notifications1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

/**
* | output |
* | --- |
* | "Notifications" |
*
* @param {Userprofile_Notifications1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_notifications1 = /** @type {((inputs?: Userprofile_Notifications1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Notifications1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_notifications1(inputs)
	if (locale === "es") return es_userprofile_notifications1(inputs)
	if (locale === "fr") return fr_userprofile_notifications1(inputs)
	return ar_userprofile_notifications1(inputs)
});
export { userprofile_notifications1 as "userProfile.notifications" }