/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Alreadyconnected1Inputs */

const en_alerts_alreadyconnected1 = /** @type {(inputs: Alerts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You are already connected.`)
};

const es_alerts_alreadyconnected1 = /** @type {(inputs: Alerts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ya están conectados.`)
};

const fr_alerts_alreadyconnected1 = /** @type {(inputs: Alerts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes déjà connectés.`)
};

const ar_alerts_alreadyconnected1 = /** @type {(inputs: Alerts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنتما متصلان بالفعل.`)
};

/**
* | output |
* | --- |
* | "You are already connected." |
*
* @param {Alerts_Alreadyconnected1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_alreadyconnected1 = /** @type {((inputs?: Alerts_Alreadyconnected1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Alreadyconnected1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_alreadyconnected1(inputs)
	if (locale === "es") return es_alerts_alreadyconnected1(inputs)
	if (locale === "fr") return fr_alerts_alreadyconnected1(inputs)
	return ar_alerts_alreadyconnected1(inputs)
});
export { alerts_alreadyconnected1 as "alerts.alreadyConnected" }