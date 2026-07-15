/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Takemehome3Inputs */

const en_consentflow_takemehome3 = /** @type {(inputs: Consentflow_Takemehome3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Take me Home`)
};

const es_consentflow_takemehome3 = /** @type {(inputs: Consentflow_Takemehome3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Llévame al Inicio`)
};

const fr_consentflow_takemehome3 = /** @type {(inputs: Consentflow_Takemehome3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour à l'accueil`)
};

const ar_consentflow_takemehome3 = /** @type {(inputs: Consentflow_Takemehome3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خذني إلى الرئيسية`)
};

/**
* | output |
* | --- |
* | "Take me Home" |
*
* @param {Consentflow_Takemehome3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_takemehome3 = /** @type {((inputs?: Consentflow_Takemehome3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Takemehome3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_takemehome3(inputs)
	if (locale === "es") return es_consentflow_takemehome3(inputs)
	if (locale === "fr") return fr_consentflow_takemehome3(inputs)
	return ar_consentflow_takemehome3(inputs)
});
export { consentflow_takemehome3 as "consentFlow.takeMeHome" }