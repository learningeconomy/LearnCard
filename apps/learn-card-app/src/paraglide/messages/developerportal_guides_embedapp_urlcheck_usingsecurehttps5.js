/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Usingsecurehttps5Inputs */

const en_developerportal_guides_embedapp_urlcheck_usingsecurehttps5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Usingsecurehttps5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Using secure HTTPS`)
};

const es_developerportal_guides_embedapp_urlcheck_usingsecurehttps5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Usingsecurehttps5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Using secure HTTPS`)
};

const fr_developerportal_guides_embedapp_urlcheck_usingsecurehttps5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Usingsecurehttps5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Using secure HTTPS`)
};

const ar_developerportal_guides_embedapp_urlcheck_usingsecurehttps5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Usingsecurehttps5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Using secure HTTPS`)
};

/**
* | output |
* | --- |
* | "Using secure HTTPS" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Usingsecurehttps5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_usingsecurehttps5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Usingsecurehttps5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Usingsecurehttps5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_usingsecurehttps5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_usingsecurehttps5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_usingsecurehttps5(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_usingsecurehttps5(inputs)
});
export { developerportal_guides_embedapp_urlcheck_usingsecurehttps5 as "developerPortal.guides.embedApp.urlCheck.usingSecureHttps" }