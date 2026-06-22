/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Title4Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_title4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue & Verify`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_title4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir y Verificar`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_title4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre et Vérifier`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_title4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإصدار والتحقق`)
};

/**
* | output |
* | --- |
* | "Issue & Verify" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_title4 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_title4(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_title4(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_title4(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_title4 as "developerPortal.guides.issueCredentials.issueVerifyStep.title" }