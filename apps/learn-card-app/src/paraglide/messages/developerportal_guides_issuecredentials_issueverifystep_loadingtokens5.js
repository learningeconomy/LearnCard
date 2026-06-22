/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Loadingtokens5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_loadingtokens5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Loadingtokens5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading tokens...`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_loadingtokens5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Loadingtokens5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando tokens...`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_loadingtokens5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Loadingtokens5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des jetons…`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_loadingtokens5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Loadingtokens5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل الرموز…`)
};

/**
* | output |
* | --- |
* | "Loading tokens..." |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Loadingtokens5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_loadingtokens5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Loadingtokens5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Loadingtokens5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_loadingtokens5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_loadingtokens5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_loadingtokens5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_loadingtokens5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_loadingtokens5 as "developerPortal.guides.issueCredentials.issueVerifyStep.loadingTokens" }