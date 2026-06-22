/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Httpallowedlocalhost5Inputs */

const en_developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Httpallowedlocalhost5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTP allowed for localhost`)
};

const es_developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Httpallowedlocalhost5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTP allowed for localhost`)
};

const fr_developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Httpallowedlocalhost5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTP allowed for localhost`)
};

const ar_developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Httpallowedlocalhost5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTP allowed for localhost`)
};

/**
* | output |
* | --- |
* | "HTTP allowed for localhost" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Httpallowedlocalhost5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Httpallowedlocalhost5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Httpallowedlocalhost5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5(inputs)
});
export { developerportal_guides_embedapp_urlcheck_httpallowedlocalhost5 as "developerPortal.guides.embedApp.urlCheck.httpAllowedLocalhost" }