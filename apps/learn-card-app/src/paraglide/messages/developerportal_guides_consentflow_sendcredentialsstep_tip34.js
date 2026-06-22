/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip34Inputs */

const en_developerportal_guides_consentflow_sendcredentialsstep_tip34 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Store user DIDs securely with their account data`)
};

const es_developerportal_guides_consentflow_sendcredentialsstep_tip34 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Almacena los DIDs de los usuarios de forma segura con sus datos de cuenta`)
};

const fr_developerportal_guides_consentflow_sendcredentialsstep_tip34 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stockez les DIDs des utilisateurs de manière sécurisée avec leurs données de compte`)
};

const ar_developerportal_guides_consentflow_sendcredentialsstep_tip34 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتخزين DIDs المستخدمين بشكل آمن مع بيانات حساباتهم`)
};

/**
* | output |
* | --- |
* | "Store user DIDs securely with their account data" |
*
* @param {Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_sendcredentialsstep_tip34 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_sendcredentialsstep_tip34(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_sendcredentialsstep_tip34(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_sendcredentialsstep_tip34(inputs)
	return ar_developerportal_guides_consentflow_sendcredentialsstep_tip34(inputs)
});
export { developerportal_guides_consentflow_sendcredentialsstep_tip34 as "developerPortal.guides.consentFlow.sendCredentialsStep.tip3" }