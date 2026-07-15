/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Notyou2Inputs */

const en_consentflow_notyou2 = /** @type {(inputs: Consentflow_Notyou2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not you?`)
};

const es_consentflow_notyou2 = /** @type {(inputs: Consentflow_Notyou2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿No eres tú?`)
};

const fr_consentflow_notyou2 = /** @type {(inputs: Consentflow_Notyou2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas vous ?`)
};

const ar_consentflow_notyou2 = /** @type {(inputs: Consentflow_Notyou2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لست أنت؟`)
};

/**
* | output |
* | --- |
* | "Not you?" |
*
* @param {Consentflow_Notyou2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_notyou2 = /** @type {((inputs?: Consentflow_Notyou2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Notyou2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_notyou2(inputs)
	if (locale === "es") return es_consentflow_notyou2(inputs)
	if (locale === "fr") return fr_consentflow_notyou2(inputs)
	return ar_consentflow_notyou2(inputs)
});
export { consentflow_notyou2 as "consentFlow.notYou" }