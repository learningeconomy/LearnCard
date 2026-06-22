/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Apirefrowsearch5Inputs */

const en_developerportal_integrationguide_iframe_apirefrowsearch5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowsearch5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request credentials by query`)
};

const es_developerportal_integrationguide_iframe_apirefrowsearch5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowsearch5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar credenciales por consulta`)
};

const fr_developerportal_integrationguide_iframe_apirefrowsearch5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowsearch5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander des identifiants par requête`)
};

const ar_developerportal_integrationguide_iframe_apirefrowsearch5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowsearch5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب بيانات الاعتماد حسب الاستعلام`)
};

/**
* | output |
* | --- |
* | "Request credentials by query" |
*
* @param {Developerportal_Integrationguide_Iframe_Apirefrowsearch5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_apirefrowsearch5 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Apirefrowsearch5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Apirefrowsearch5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_apirefrowsearch5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_apirefrowsearch5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_apirefrowsearch5(inputs)
	return ar_developerportal_integrationguide_iframe_apirefrowsearch5(inputs)
});
export { developerportal_integrationguide_iframe_apirefrowsearch5 as "developerPortal.integrationGuide.iframe.apiRefRowSearch" }