/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Fixissues4Inputs */

const en_developerportal_guides_embedapp_urlcheck_fixissues4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Fixissues4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fix the issues above before continuing. See the header examples below.`)
};

const es_developerportal_guides_embedapp_urlcheck_fixissues4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Fixissues4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fix the issues above before continuing. See the header examples below.`)
};

const fr_developerportal_guides_embedapp_urlcheck_fixissues4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Fixissues4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fix the issues above before continuing. See the header examples below.`)
};

const ar_developerportal_guides_embedapp_urlcheck_fixissues4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Fixissues4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fix the issues above before continuing. See the header examples below.`)
};

/**
* | output |
* | --- |
* | "Fix the issues above before continuing. See the header examples below." |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Fixissues4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_fixissues4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Fixissues4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Fixissues4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_fixissues4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_fixissues4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_fixissues4(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_fixissues4(inputs)
});
export { developerportal_guides_embedapp_urlcheck_fixissues4 as "developerPortal.guides.embedApp.urlCheck.fixIssues" }