/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_ClaimInputs */

const en_alerts_claim = /** @type {(inputs: Alerts_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim`)
};

const es_alerts_claim = /** @type {(inputs: Alerts_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamar`)
};

const de_alerts_claim = /** @type {(inputs: Alerts_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beanspruchen`)
};

const ar_alerts_claim = /** @type {(inputs: Alerts_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطالبة`)
};

const fr_alerts_claim = /** @type {(inputs: Alerts_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamer`)
};

const ko_alerts_claim = /** @type {(inputs: Alerts_ClaimInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수령`)
};

/**
* | output |
* | --- |
* | "Claim" |
*
* @param {Alerts_ClaimInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_claim = /** @type {((inputs?: Alerts_ClaimInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ClaimInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_claim(inputs)
	if (locale === "es") return es_alerts_claim(inputs)
	if (locale === "de") return de_alerts_claim(inputs)
	if (locale === "ar") return ar_alerts_claim(inputs)
	if (locale === "fr") return fr_alerts_claim(inputs)
	return ko_alerts_claim(inputs)
});
export { alerts_claim as "alerts.claim" }