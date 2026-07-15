/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Termsofservice3Inputs */

const en_consentflow_termsofservice3 = /** @type {(inputs: Consentflow_Termsofservice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service`)
};

const es_consentflow_termsofservice3 = /** @type {(inputs: Consentflow_Termsofservice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Términos del Servicio`)
};

const fr_consentflow_termsofservice3 = /** @type {(inputs: Consentflow_Termsofservice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions d'utilisation`)
};

const ar_consentflow_termsofservice3 = /** @type {(inputs: Consentflow_Termsofservice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service`)
};

/**
* | output |
* | --- |
* | "Terms of Service" |
*
* @param {Consentflow_Termsofservice3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_termsofservice3 = /** @type {((inputs?: Consentflow_Termsofservice3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Termsofservice3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_termsofservice3(inputs)
	if (locale === "es") return es_consentflow_termsofservice3(inputs)
	if (locale === "fr") return fr_consentflow_termsofservice3(inputs)
	return ar_consentflow_termsofservice3(inputs)
});
export { consentflow_termsofservice3 as "consentFlow.termsOfService" }