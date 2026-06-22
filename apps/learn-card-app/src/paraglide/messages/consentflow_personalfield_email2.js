/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Personalfield_Email2Inputs */

const en_consentflow_personalfield_email2 = /** @type {(inputs: Consentflow_Personalfield_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`email`)
};

const es_consentflow_personalfield_email2 = /** @type {(inputs: Consentflow_Personalfield_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`correo electrónico`)
};

const fr_consentflow_personalfield_email2 = /** @type {(inputs: Consentflow_Personalfield_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e-mail`)
};

const ar_consentflow_personalfield_email2 = /** @type {(inputs: Consentflow_Personalfield_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "email" |
*
* @param {Consentflow_Personalfield_Email2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_personalfield_email2 = /** @type {((inputs?: Consentflow_Personalfield_Email2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Personalfield_Email2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_personalfield_email2(inputs)
	if (locale === "es") return es_consentflow_personalfield_email2(inputs)
	if (locale === "fr") return fr_consentflow_personalfield_email2(inputs)
	return ar_consentflow_personalfield_email2(inputs)
});
export { consentflow_personalfield_email2 as "consentFlow.personalField.email" }