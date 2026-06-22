/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Allpassed4Inputs */

const en_developerportal_guides_embedapp_urlcheck_allpassed4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Allpassed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options).`)
};

const es_developerportal_guides_embedapp_urlcheck_allpassed4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Allpassed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options).`)
};

const fr_developerportal_guides_embedapp_urlcheck_allpassed4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Allpassed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options).`)
};

const ar_developerportal_guides_embedapp_urlcheck_allpassed4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Allpassed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options).`)
};

/**
* | output |
* | --- |
* | "Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options)." |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Allpassed4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_allpassed4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Allpassed4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Allpassed4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_allpassed4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_allpassed4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_allpassed4(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_allpassed4(inputs)
});
export { developerportal_guides_embedapp_urlcheck_allpassed4 as "developerPortal.guides.embedApp.urlCheck.allPassed" }