/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Selecttokenhint6Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Selecttokenhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a token to use`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Selecttokenhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un token para usar`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Selecttokenhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un jeton à utiliser`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Selecttokenhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر رمزاً للاستخدام`)
};

/**
* | output |
* | --- |
* | "Select a token to use" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Selecttokenhint6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Selecttokenhint6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Selecttokenhint6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_selecttokenhint6 as "developerPortal.guides.issueCredentials.issueVerifyStep.selectTokenHint" }