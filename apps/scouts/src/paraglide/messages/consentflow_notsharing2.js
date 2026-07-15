/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Notsharing2Inputs */

const en_consentflow_notsharing2 = /** @type {(inputs: Consentflow_Notsharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not Sharing`)
};

const es_consentflow_notsharing2 = /** @type {(inputs: Consentflow_Notsharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Compartiendo`)
};

const fr_consentflow_notsharing2 = /** @type {(inputs: Consentflow_Notsharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun partage`)
};

const ar_consentflow_notsharing2 = /** @type {(inputs: Consentflow_Notsharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تتم المشاركة`)
};

/**
* | output |
* | --- |
* | "Not Sharing" |
*
* @param {Consentflow_Notsharing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_notsharing2 = /** @type {((inputs?: Consentflow_Notsharing2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Notsharing2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_notsharing2(inputs)
	if (locale === "es") return es_consentflow_notsharing2(inputs)
	if (locale === "fr") return fr_consentflow_notsharing2(inputs)
	return ar_consentflow_notsharing2(inputs)
});
export { consentflow_notsharing2 as "consentFlow.notSharing" }