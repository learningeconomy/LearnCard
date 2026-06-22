/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Hidebutton5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_hidebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Hidebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_hidebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Hidebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocultar`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_hidebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Hidebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Masquer`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_hidebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Hidebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إخفاء`)
};

/**
* | output |
* | --- |
* | "Hide" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Hidebutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_hidebutton5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Hidebutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Hidebutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_hidebutton5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_hidebutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_hidebutton5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_hidebutton5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_hidebutton5 as "developerPortal.guides.issueCredentials.issueVerifyStep.hideButton" }