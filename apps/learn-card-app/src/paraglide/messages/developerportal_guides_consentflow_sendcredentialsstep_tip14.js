/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip14Inputs */

const en_developerportal_guides_consentflow_sendcredentialsstep_tip14 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Store API keys in environment variables, never in code`)
};

const es_developerportal_guides_consentflow_sendcredentialsstep_tip14 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guarda las claves de API en variables de entorno, nunca en código`)
};

const fr_developerportal_guides_consentflow_sendcredentialsstep_tip14 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stockez les clés API dans des variables d'environnement, jamais dans le code`)
};

const ar_developerportal_guides_consentflow_sendcredentialsstep_tip14 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتخزين مفاتيح API في متغيرات البيئة، وليس في الكود أبداً`)
};

/**
* | output |
* | --- |
* | "Store API keys in environment variables, never in code" |
*
* @param {Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_sendcredentialsstep_tip14 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Sendcredentialsstep_Tip14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_sendcredentialsstep_tip14(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_sendcredentialsstep_tip14(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_sendcredentialsstep_tip14(inputs)
	return ar_developerportal_guides_consentflow_sendcredentialsstep_tip14(inputs)
});
export { developerportal_guides_consentflow_sendcredentialsstep_tip14 as "developerPortal.guides.consentFlow.sendCredentialsStep.tip1" }