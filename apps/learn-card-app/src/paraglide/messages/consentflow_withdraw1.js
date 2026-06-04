/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Withdraw1Inputs */

const en_consentflow_withdraw1 = /** @type {(inputs: Consentflow_Withdraw1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Withdraw`)
};

const es_consentflow_withdraw1 = /** @type {(inputs: Consentflow_Withdraw1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retirar`)
};

const de_consentflow_withdraw1 = /** @type {(inputs: Consentflow_Withdraw1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zurückziehen`)
};

const ar_consentflow_withdraw1 = /** @type {(inputs: Consentflow_Withdraw1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سحب`)
};

const fr_consentflow_withdraw1 = /** @type {(inputs: Consentflow_Withdraw1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retirer`)
};

const ko_consentflow_withdraw1 = /** @type {(inputs: Consentflow_Withdraw1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`철회`)
};

/**
* | output |
* | --- |
* | "Withdraw" |
*
* @param {Consentflow_Withdraw1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_withdraw1 = /** @type {((inputs?: Consentflow_Withdraw1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Withdraw1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_withdraw1(inputs)
	if (locale === "es") return es_consentflow_withdraw1(inputs)
	if (locale === "de") return de_consentflow_withdraw1(inputs)
	if (locale === "ar") return ar_consentflow_withdraw1(inputs)
	if (locale === "fr") return fr_consentflow_withdraw1(inputs)
	return ko_consentflow_withdraw1(inputs)
});
export { consentflow_withdraw1 as "consentFlow.withdraw" }