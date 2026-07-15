/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Privacypolicy2Inputs */

const en_consentflow_privacypolicy2 = /** @type {(inputs: Consentflow_Privacypolicy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

const es_consentflow_privacypolicy2 = /** @type {(inputs: Consentflow_Privacypolicy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de Privacidad`)
};

const fr_consentflow_privacypolicy2 = /** @type {(inputs: Consentflow_Privacypolicy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Politique de confidentialité`)
};

const ar_consentflow_privacypolicy2 = /** @type {(inputs: Consentflow_Privacypolicy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياسة الخصوصية`)
};

/**
* | output |
* | --- |
* | "Privacy Policy" |
*
* @param {Consentflow_Privacypolicy2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_privacypolicy2 = /** @type {((inputs?: Consentflow_Privacypolicy2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Privacypolicy2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_privacypolicy2(inputs)
	if (locale === "es") return es_consentflow_privacypolicy2(inputs)
	if (locale === "fr") return fr_consentflow_privacypolicy2(inputs)
	return ar_consentflow_privacypolicy2(inputs)
});
export { consentflow_privacypolicy2 as "consentFlow.privacyPolicy" }