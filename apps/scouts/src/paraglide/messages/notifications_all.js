/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_AllInputs */

const en_notifications_all = /** @type {(inputs: Notifications_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_notifications_all = /** @type {(inputs: Notifications_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todo`)
};

const fr_notifications_all = /** @type {(inputs: Notifications_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout`)
};

const ar_notifications_all = /** @type {(inputs: Notifications_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكل`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Notifications_AllInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_all = /** @type {((inputs?: Notifications_AllInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_AllInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_all(inputs)
	if (locale === "es") return es_notifications_all(inputs)
	if (locale === "fr") return fr_notifications_all(inputs)
	return ar_notifications_all(inputs)
});
export { notifications_all as "notifications.all" }