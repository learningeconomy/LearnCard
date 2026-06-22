/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonly4Inputs */

const en_developerportal_guides_issuecredentials_scopeoptions_credentialsonly4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials Only`)
};

const es_developerportal_guides_issuecredentials_scopeoptions_credentialsonly4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo Credenciales`)
};

const fr_developerportal_guides_issuecredentials_scopeoptions_credentialsonly4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificats Uniquement`)
};

const ar_developerportal_guides_issuecredentials_scopeoptions_credentialsonly4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المؤهلات فقط`)
};

/**
* | output |
* | --- |
* | "Credentials Only" |
*
* @param {Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonly4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_scopeoptions_credentialsonly4 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonly4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonly4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_scopeoptions_credentialsonly4(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_scopeoptions_credentialsonly4(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_scopeoptions_credentialsonly4(inputs)
	return ar_developerportal_guides_issuecredentials_scopeoptions_credentialsonly4(inputs)
});
export { developerportal_guides_issuecredentials_scopeoptions_credentialsonly4 as "developerPortal.guides.issueCredentials.scopeOptions.credentialsOnly" }