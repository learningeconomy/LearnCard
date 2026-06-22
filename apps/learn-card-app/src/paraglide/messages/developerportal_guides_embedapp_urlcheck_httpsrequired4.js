/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Httpsrequired4Inputs */

const en_developerportal_guides_embedapp_urlcheck_httpsrequired4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Httpsrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTPS required for production`)
};

const es_developerportal_guides_embedapp_urlcheck_httpsrequired4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Httpsrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTPS obligatorio for production`)
};

const fr_developerportal_guides_embedapp_urlcheck_httpsrequired4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Httpsrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTPS obligatoire for production`)
};

const ar_developerportal_guides_embedapp_urlcheck_httpsrequired4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Httpsrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTPS مطلوب for production`)
};

/**
* | output |
* | --- |
* | "HTTPS required for production" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Httpsrequired4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_httpsrequired4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Httpsrequired4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Httpsrequired4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_httpsrequired4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_httpsrequired4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_httpsrequired4(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_httpsrequired4(inputs)
});
export { developerportal_guides_embedapp_urlcheck_httpsrequired4 as "developerPortal.guides.embedApp.urlCheck.httpsRequired" }