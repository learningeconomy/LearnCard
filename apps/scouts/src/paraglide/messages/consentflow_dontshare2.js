/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Dontshare2Inputs */

const en_consentflow_dontshare2 = /** @type {(inputs: Consentflow_Dontshare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Don't share any {plural}.`)
};

const es_consentflow_dontshare2 = /** @type {(inputs: Consentflow_Dontshare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No compartas ningún {plural}.`)
};

const fr_consentflow_dontshare2 = /** @type {(inputs: Consentflow_Dontshare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ne partager aucun {plural}.`)
};

const ar_consentflow_dontshare2 = /** @type {(inputs: Consentflow_Dontshare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تشارك أي {plural}.`)
};

/**
* | output |
* | --- |
* | "Don't share any {plural}." |
*
* @param {Consentflow_Dontshare2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_dontshare2 = /** @type {((inputs?: Consentflow_Dontshare2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Dontshare2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_dontshare2(inputs)
	if (locale === "es") return es_consentflow_dontshare2(inputs)
	if (locale === "fr") return fr_consentflow_dontshare2(inputs)
	return ar_consentflow_dontshare2(inputs)
});
export { consentflow_dontshare2 as "consentFlow.dontShare" }