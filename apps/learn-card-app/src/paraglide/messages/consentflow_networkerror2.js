/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Networkerror2Inputs */

const en_consentflow_networkerror2 = /** @type {(inputs: Consentflow_Networkerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network Error`)
};

const es_consentflow_networkerror2 = /** @type {(inputs: Consentflow_Networkerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error de red`)
};

const fr_consentflow_networkerror2 = /** @type {(inputs: Consentflow_Networkerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur réseau`)
};

const ar_consentflow_networkerror2 = /** @type {(inputs: Consentflow_Networkerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في الشبكة`)
};

/**
* | output |
* | --- |
* | "Network Error" |
*
* @param {Consentflow_Networkerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_networkerror2 = /** @type {((inputs?: Consentflow_Networkerror2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Networkerror2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_networkerror2(inputs)
	if (locale === "es") return es_consentflow_networkerror2(inputs)
	if (locale === "fr") return fr_consentflow_networkerror2(inputs)
	return ar_consentflow_networkerror2(inputs)
});
export { consentflow_networkerror2 as "consentFlow.networkError" }