/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Apirefrowdestroy5Inputs */

const en_developerportal_integrationguide_iframe_apirefrowdestroy5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowdestroy5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clean up SDK`)
};

const es_developerportal_integrationguide_iframe_apirefrowdestroy5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowdestroy5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Limpiar SDK`)
};

const fr_developerportal_integrationguide_iframe_apirefrowdestroy5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowdestroy5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nettoyer le SDK`)
};

const ar_developerportal_integrationguide_iframe_apirefrowdestroy5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowdestroy5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنظيف SDK`)
};

/**
* | output |
* | --- |
* | "Clean up SDK" |
*
* @param {Developerportal_Integrationguide_Iframe_Apirefrowdestroy5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_apirefrowdestroy5 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Apirefrowdestroy5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Apirefrowdestroy5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_apirefrowdestroy5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_apirefrowdestroy5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_apirefrowdestroy5(inputs)
	return ar_developerportal_integrationguide_iframe_apirefrowdestroy5(inputs)
});
export { developerportal_integrationguide_iframe_apirefrowdestroy5 as "developerPortal.integrationGuide.iframe.apiRefRowDestroy" }