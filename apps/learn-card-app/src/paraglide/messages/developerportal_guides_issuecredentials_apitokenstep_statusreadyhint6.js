/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Apitokenstep_Statusreadyhint6Inputs */

const en_developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusreadyhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy a token to use in your code`)
};

const es_developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusreadyhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia un token para usar en tu código`)
};

const fr_developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusreadyhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiez un jeton à utiliser dans votre code`)
};

const ar_developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusreadyhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انسخ رمزاً لاستخدامه في الكود الخاص بك`)
};

/**
* | output |
* | --- |
* | "Copy a token to use in your code" |
*
* @param {Developerportal_Guides_Issuecredentials_Apitokenstep_Statusreadyhint6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusreadyhint6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Apitokenstep_Statusreadyhint6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6(inputs)
	return ar_developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6(inputs)
});
export { developerportal_guides_issuecredentials_apitokenstep_statusreadyhint6 as "developerPortal.guides.issueCredentials.apiTokenStep.statusReadyHint" }