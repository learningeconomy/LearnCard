/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Selectivesharing2Inputs */

const en_consentflow_selectivesharing2 = /** @type {(inputs: Consentflow_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selective Sharing`)
};

const es_consentflow_selectivesharing2 = /** @type {(inputs: Consentflow_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uso Selectivo`)
};

const fr_consentflow_selectivesharing2 = /** @type {(inputs: Consentflow_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partage sélectif`)
};

const ar_consentflow_selectivesharing2 = /** @type {(inputs: Consentflow_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selective Sharing`)
};

/**
* | output |
* | --- |
* | "Selective Sharing" |
*
* @param {Consentflow_Selectivesharing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_selectivesharing2 = /** @type {((inputs?: Consentflow_Selectivesharing2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Selectivesharing2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_selectivesharing2(inputs)
	if (locale === "es") return es_consentflow_selectivesharing2(inputs)
	if (locale === "fr") return fr_consentflow_selectivesharing2(inputs)
	return ar_consentflow_selectivesharing2(inputs)
});
export { consentflow_selectivesharing2 as "consentFlow.selectiveSharing" }