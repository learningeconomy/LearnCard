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

const de_consentflow_networkerror2 = /** @type {(inputs: Consentflow_Networkerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Netzwerkfehler`)
};

const ar_consentflow_networkerror2 = /** @type {(inputs: Consentflow_Networkerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في الشبكة`)
};

const fr_consentflow_networkerror2 = /** @type {(inputs: Consentflow_Networkerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur réseau`)
};

const ko_consentflow_networkerror2 = /** @type {(inputs: Consentflow_Networkerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`네트워크 오류`)
};

/**
* | output |
* | --- |
* | "Network Error" |
*
* @param {Consentflow_Networkerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_networkerror2 = /** @type {((inputs?: Consentflow_Networkerror2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Networkerror2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_networkerror2(inputs)
	if (locale === "es") return es_consentflow_networkerror2(inputs)
	if (locale === "de") return de_consentflow_networkerror2(inputs)
	if (locale === "ar") return ar_consentflow_networkerror2(inputs)
	if (locale === "fr") return fr_consentflow_networkerror2(inputs)
	return ko_consentflow_networkerror2(inputs)
});
export { consentflow_networkerror2 as "consentFlow.networkError" }