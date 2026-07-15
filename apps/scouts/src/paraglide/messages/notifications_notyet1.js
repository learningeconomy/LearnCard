/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Notyet1Inputs */

const en_notifications_notyet1 = /** @type {(inputs: Notifications_Notyet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not Yet`)
};

const es_notifications_notyet1 = /** @type {(inputs: Notifications_Notyet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ahora no`)
};

const fr_notifications_notyet1 = /** @type {(inputs: Notifications_Notyet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore`)
};

const ar_notifications_notyet1 = /** @type {(inputs: Notifications_Notyet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not Yet`)
};

/**
* | output |
* | --- |
* | "Not Yet" |
*
* @param {Notifications_Notyet1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_notyet1 = /** @type {((inputs?: Notifications_Notyet1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Notyet1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_notyet1(inputs)
	if (locale === "es") return es_notifications_notyet1(inputs)
	if (locale === "fr") return fr_notifications_notyet1(inputs)
	return ar_notifications_notyet1(inputs)
});
export { notifications_notyet1 as "notifications.notYet" }