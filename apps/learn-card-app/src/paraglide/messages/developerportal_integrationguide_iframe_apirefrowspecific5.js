/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Apirefrowspecific5Inputs */

const en_developerportal_integrationguide_iframe_apirefrowspecific5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowspecific5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request specific credential`)
};

const es_developerportal_integrationguide_iframe_apirefrowspecific5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowspecific5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar credencial específica`)
};

const fr_developerportal_integrationguide_iframe_apirefrowspecific5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowspecific5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander un identifiant spécifique`)
};

const ar_developerportal_integrationguide_iframe_apirefrowspecific5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowspecific5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب بيانات اعتماد محددة`)
};

/**
* | output |
* | --- |
* | "Request specific credential" |
*
* @param {Developerportal_Integrationguide_Iframe_Apirefrowspecific5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_apirefrowspecific5 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Apirefrowspecific5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Apirefrowspecific5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_apirefrowspecific5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_apirefrowspecific5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_apirefrowspecific5(inputs)
	return ar_developerportal_integrationguide_iframe_apirefrowspecific5(inputs)
});
export { developerportal_integrationguide_iframe_apirefrowspecific5 as "developerPortal.integrationGuide.iframe.apiRefRowSpecific" }