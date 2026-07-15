/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Signupfor3Inputs */

const en_consentflow_signupfor3 = /** @type {(inputs: Consentflow_Signupfor3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign up for LearnCard`)
};

const es_consentflow_signupfor3 = /** @type {(inputs: Consentflow_Signupfor3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Regístrate en LearnCard`)
};

const fr_consentflow_signupfor3 = /** @type {(inputs: Consentflow_Signupfor3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`S'inscrire à LearnCard`)
};

const ar_consentflow_signupfor3 = /** @type {(inputs: Consentflow_Signupfor3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign up for LearnCard`)
};

/**
* | output |
* | --- |
* | "Sign up for LearnCard" |
*
* @param {Consentflow_Signupfor3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_signupfor3 = /** @type {((inputs?: Consentflow_Signupfor3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Signupfor3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_signupfor3(inputs)
	if (locale === "es") return es_consentflow_signupfor3(inputs)
	if (locale === "fr") return fr_consentflow_signupfor3(inputs)
	return ar_consentflow_signupfor3(inputs)
});
export { consentflow_signupfor3 as "consentFlow.signUpFor" }