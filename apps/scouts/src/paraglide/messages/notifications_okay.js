/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_OkayInputs */

const en_notifications_okay = /** @type {(inputs: Notifications_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Okay`)
};

const es_notifications_okay = /** @type {(inputs: Notifications_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`De acuerdo`)
};

const fr_notifications_okay = /** @type {(inputs: Notifications_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`D'accord`)
};

const ar_notifications_okay = /** @type {(inputs: Notifications_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسناً`)
};

/**
* | output |
* | --- |
* | "Okay" |
*
* @param {Notifications_OkayInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_okay = /** @type {((inputs?: Notifications_OkayInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_OkayInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_okay(inputs)
	if (locale === "es") return es_notifications_okay(inputs)
	if (locale === "fr") return fr_notifications_okay(inputs)
	return ar_notifications_okay(inputs)
});
export { notifications_okay as "notifications.okay" }