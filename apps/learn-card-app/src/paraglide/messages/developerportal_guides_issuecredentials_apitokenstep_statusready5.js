/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, context: NonNullable<unknown> }} Developerportal_Guides_Issuecredentials_Apitokenstep_Statusready5Inputs */

const en_developerportal_guides_issuecredentials_apitokenstep_statusready5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusready5Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} tokens ready`);
	return /** @type {LocalizedString} */ (`${i?.count} token ready`)
	
};

const es_developerportal_guides_issuecredentials_apitokenstep_statusready5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusready5Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} tokens listos`);
	return /** @type {LocalizedString} */ (`${i?.count} token listo`)
	
};

const fr_developerportal_guides_issuecredentials_apitokenstep_statusready5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusready5Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} jetons prêts`);
	return /** @type {LocalizedString} */ (`${i?.count} jeton prêt`)
	
};

const ar_developerportal_guides_issuecredentials_apitokenstep_statusready5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusready5Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} رموز جاهزة`);
	return /** @type {LocalizedString} */ (`${i?.count} رمز جاهز`)
	
};

/**
* | context | output |
* | --- | --- |
* | "plural" | "{count} tokens ready" |
* | * | "{count} token ready" |
*
* @param {Developerportal_Guides_Issuecredentials_Apitokenstep_Statusready5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_apitokenstep_statusready5 = /** @type {((inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statusready5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Apitokenstep_Statusready5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_apitokenstep_statusready5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_apitokenstep_statusready5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_apitokenstep_statusready5(inputs)
	return ar_developerportal_guides_issuecredentials_apitokenstep_statusready5(inputs)
});
export { developerportal_guides_issuecredentials_apitokenstep_statusready5 as "developerPortal.guides.issueCredentials.apiTokenStep.statusReady" }