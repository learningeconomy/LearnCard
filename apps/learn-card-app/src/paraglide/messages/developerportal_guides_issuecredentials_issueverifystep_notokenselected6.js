/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenselected6Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_notokenselected6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenselected6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No token selected`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_notokenselected6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenselected6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ningún token seleccionado`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_notokenselected6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenselected6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun jeton sélectionné`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_notokenselected6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenselected6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تحديد رمز`)
};

/**
* | output |
* | --- |
* | "No token selected" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenselected6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_notokenselected6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenselected6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenselected6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_notokenselected6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_notokenselected6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_notokenselected6(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_notokenselected6(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_notokenselected6 as "developerPortal.guides.issueCredentials.issueVerifyStep.noTokenSelected" }