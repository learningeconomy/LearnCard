/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Urlcheckresults5Inputs */

const en_developerportal_guides_embedapp_urlcheck_urlcheckresults5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Urlcheckresults5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL Check Results`)
};

const es_developerportal_guides_embedapp_urlcheck_urlcheckresults5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Urlcheckresults5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL Verificar Results`)
};

const fr_developerportal_guides_embedapp_urlcheck_urlcheckresults5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Urlcheckresults5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL Vérifier Results`)
};

const ar_developerportal_guides_embedapp_urlcheck_urlcheckresults5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Urlcheckresults5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL تحقق Results`)
};

/**
* | output |
* | --- |
* | "URL Check Results" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Urlcheckresults5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_urlcheckresults5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Urlcheckresults5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Urlcheckresults5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_urlcheckresults5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_urlcheckresults5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_urlcheckresults5(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_urlcheckresults5(inputs)
});
export { developerportal_guides_embedapp_urlcheck_urlcheckresults5 as "developerPortal.guides.embedApp.urlCheck.urlCheckResults" }