/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Terms_Developerprivacypolicy3Inputs */

const en_consentflow_terms_developerprivacypolicy3 = /** @type {(inputs: Consentflow_Terms_Developerprivacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer's Privacy Policy`)
};

const es_consentflow_terms_developerprivacypolicy3 = /** @type {(inputs: Consentflow_Terms_Developerprivacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de privacidad del desarrollador`)
};

const fr_consentflow_terms_developerprivacypolicy3 = /** @type {(inputs: Consentflow_Terms_Developerprivacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Politique de confidentialité du développeur`)
};

const ar_consentflow_terms_developerprivacypolicy3 = /** @type {(inputs: Consentflow_Terms_Developerprivacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياسة خصوصية المطوّر`)
};

/**
* | output |
* | --- |
* | "Developer's Privacy Policy" |
*
* @param {Consentflow_Terms_Developerprivacypolicy3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_terms_developerprivacypolicy3 = /** @type {((inputs?: Consentflow_Terms_Developerprivacypolicy3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Terms_Developerprivacypolicy3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_terms_developerprivacypolicy3(inputs)
	if (locale === "es") return es_consentflow_terms_developerprivacypolicy3(inputs)
	if (locale === "fr") return fr_consentflow_terms_developerprivacypolicy3(inputs)
	return ar_consentflow_terms_developerprivacypolicy3(inputs)
});
export { consentflow_terms_developerprivacypolicy3 as "consentFlow.terms.developerPrivacyPolicy" }