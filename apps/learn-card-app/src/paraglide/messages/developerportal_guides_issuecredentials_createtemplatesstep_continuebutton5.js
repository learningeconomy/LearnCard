/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Createtemplatesstep_Continuebutton5Inputs */

const en_developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Continuebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue`)
};

const es_developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Continuebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar`)
};

const fr_developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Continuebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer`)
};

const ar_developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Continuebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة`)
};

/**
* | output |
* | --- |
* | "Continue" |
*
* @param {Developerportal_Guides_Issuecredentials_Createtemplatesstep_Continuebutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Continuebutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Createtemplatesstep_Continuebutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5(inputs)
	return ar_developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5(inputs)
});
export { developerportal_guides_issuecredentials_createtemplatesstep_continuebutton5 as "developerPortal.guides.issueCredentials.createTemplatesStep.continueButton" }