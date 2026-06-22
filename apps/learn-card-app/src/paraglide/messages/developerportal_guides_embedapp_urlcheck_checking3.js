/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Checking3Inputs */

const en_developerportal_guides_embedapp_urlcheck_checking3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking your URL...`)
};

const es_developerportal_guides_embedapp_urlcheck_checking3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificaring your URL...`)
};

const fr_developerportal_guides_embedapp_urlcheck_checking3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiering your URL...`)
};

const ar_developerportal_guides_embedapp_urlcheck_checking3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحققing your URL...`)
};

/**
* | output |
* | --- |
* | "Checking your URL..." |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Checking3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_checking3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Checking3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Checking3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_checking3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_checking3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_checking3(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_checking3(inputs)
});
export { developerportal_guides_embedapp_urlcheck_checking3 as "developerPortal.guides.embedApp.urlCheck.checking" }