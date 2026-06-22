/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Steps_Apitoken3Inputs */

const en_developerportal_guides_issuecredentials_steps_apitoken3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Apitoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create API Token`)
};

const es_developerportal_guides_issuecredentials_steps_apitoken3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Apitoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Token de API`)
};

const fr_developerportal_guides_issuecredentials_steps_apitoken3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Apitoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un Jeton API`)
};

const ar_developerportal_guides_issuecredentials_steps_apitoken3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Apitoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء رمز API`)
};

/**
* | output |
* | --- |
* | "Create API Token" |
*
* @param {Developerportal_Guides_Issuecredentials_Steps_Apitoken3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_steps_apitoken3 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Steps_Apitoken3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Steps_Apitoken3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_steps_apitoken3(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_steps_apitoken3(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_steps_apitoken3(inputs)
	return ar_developerportal_guides_issuecredentials_steps_apitoken3(inputs)
});
export { developerportal_guides_issuecredentials_steps_apitoken3 as "developerPortal.guides.issueCredentials.steps.apiToken" }