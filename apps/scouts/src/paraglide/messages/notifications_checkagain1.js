/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Checkagain1Inputs */

const en_notifications_checkagain1 = /** @type {(inputs: Notifications_Checkagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check again!`)
};

const es_notifications_checkagain1 = /** @type {(inputs: Notifications_Checkagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Verifica de nuevo!`)
};

const fr_notifications_checkagain1 = /** @type {(inputs: Notifications_Checkagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez à nouveau !`)
};

const ar_notifications_checkagain1 = /** @type {(inputs: Notifications_Checkagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check again!`)
};

/**
* | output |
* | --- |
* | "Check again!" |
*
* @param {Notifications_Checkagain1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_checkagain1 = /** @type {((inputs?: Notifications_Checkagain1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Checkagain1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_checkagain1(inputs)
	if (locale === "es") return es_notifications_checkagain1(inputs)
	if (locale === "fr") return fr_notifications_checkagain1(inputs)
	return ar_notifications_checkagain1(inputs)
});
export { notifications_checkagain1 as "notifications.checkAgain" }