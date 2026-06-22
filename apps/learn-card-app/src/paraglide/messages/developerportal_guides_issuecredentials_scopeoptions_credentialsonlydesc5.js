/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonlydesc5Inputs */

const en_developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonlydesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue and manage credentials`)
};

const es_developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonlydesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir y gestionar credenciales`)
};

const fr_developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonlydesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre et gérer les certificats`)
};

const ar_developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonlydesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار وإدارة المؤهلات`)
};

/**
* | output |
* | --- |
* | "Issue and manage credentials" |
*
* @param {Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonlydesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonlydesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Scopeoptions_Credentialsonlydesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5(inputs)
	return ar_developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5(inputs)
});
export { developerportal_guides_issuecredentials_scopeoptions_credentialsonlydesc5 as "developerPortal.guides.issueCredentials.scopeOptions.credentialsOnlyDesc" }