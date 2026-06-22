/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ fields: NonNullable<unknown> }} Consentflow_Terms_Viewpersonal2Inputs */

const en_consentflow_terms_viewpersonal2 = /** @type {(inputs: Consentflow_Terms_Viewpersonal2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`view your ${i?.fields}`)
};

const es_consentflow_terms_viewpersonal2 = /** @type {(inputs: Consentflow_Terms_Viewpersonal2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ver tu ${i?.fields}`)
};

const fr_consentflow_terms_viewpersonal2 = /** @type {(inputs: Consentflow_Terms_Viewpersonal2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`voir votre ${i?.fields}`)
};

const ar_consentflow_terms_viewpersonal2 = /** @type {(inputs: Consentflow_Terms_Viewpersonal2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`عرض ${i?.fields}`)
};

/**
* | output |
* | --- |
* | "view your {fields}" |
*
* @param {Consentflow_Terms_Viewpersonal2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_terms_viewpersonal2 = /** @type {((inputs: Consentflow_Terms_Viewpersonal2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Terms_Viewpersonal2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_terms_viewpersonal2(inputs)
	if (locale === "es") return es_consentflow_terms_viewpersonal2(inputs)
	if (locale === "fr") return fr_consentflow_terms_viewpersonal2(inputs)
	return ar_consentflow_terms_viewpersonal2(inputs)
});
export { consentflow_terms_viewpersonal2 as "consentFlow.terms.viewPersonal" }