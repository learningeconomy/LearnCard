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

const de_alerts_alreadyconnected1 = /** @type {(inputs: Alerts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ihr seid bereits verbunden.`)
};

const ar_alerts_alreadyconnected1 = /** @type {(inputs: Alerts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنتما متصلان بالفعل.`)
};

const fr_alerts_alreadyconnected1 = /** @type {(inputs: Alerts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes déjà connectés.`)
};

const ko_alerts_alreadyconnected1 = /** @type {(inputs: Alerts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이미 연결되어 있습니다.`)
};

/**
* | output |
* | --- |
* | "You are already connected." |
*
* @param {Alerts_Alreadyconnected1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_alreadyconnected1 = /** @type {((inputs?: Alerts_Alreadyconnected1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Alreadyconnected1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_alreadyconnected1(inputs)
	if (locale === "es") return es_alerts_alreadyconnected1(inputs)
	if (locale === "de") return de_alerts_alreadyconnected1(inputs)
	if (locale === "ar") return ar_alerts_alreadyconnected1(inputs)
	if (locale === "fr") return fr_alerts_alreadyconnected1(inputs)
	return ko_alerts_alreadyconnected1(inputs)
});
export { alerts_alreadyconnected1 as "alerts.alreadyConnected" }