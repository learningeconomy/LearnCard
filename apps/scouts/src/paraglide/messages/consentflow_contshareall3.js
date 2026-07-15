/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Contshareall3Inputs */

const en_consentflow_contshareall3 = /** @type {(inputs: Consentflow_Contshareall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuously share all {plural}.`)
};

const es_consentflow_contshareall3 = /** @type {(inputs: Consentflow_Contshareall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte continuamente todos los {plural}.`)
};

const fr_consentflow_contshareall3 = /** @type {(inputs: Consentflow_Contshareall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager en continu tous les {plural}.`)
};

const ar_consentflow_contshareall3 = /** @type {(inputs: Consentflow_Contshareall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المشاركة المستمرة لكل {plural}.`)
};

/**
* | output |
* | --- |
* | "Continuously share all {plural}." |
*
* @param {Consentflow_Contshareall3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_contshareall3 = /** @type {((inputs?: Consentflow_Contshareall3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Contshareall3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_contshareall3(inputs)
	if (locale === "es") return es_consentflow_contshareall3(inputs)
	if (locale === "fr") return fr_consentflow_contshareall3(inputs)
	return ar_consentflow_contshareall3(inputs)
});
export { consentflow_contshareall3 as "consentFlow.contShareAll" }