/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Changebutton5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_changebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Changebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_changebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Changebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_changebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Changebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_changebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Changebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغيير`)
};

/**
* | output |
* | --- |
* | "Change" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Changebutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_changebutton5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Changebutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Changebutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_changebutton5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_changebutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_changebutton5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_changebutton5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_changebutton5 as "developerPortal.guides.issueCredentials.issueVerifyStep.changeButton" }