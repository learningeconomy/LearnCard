/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Apirefrowlaunch5Inputs */

const en_developerportal_integrationguide_iframe_apirefrowlaunch5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowlaunch5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch feature in host`)
};

const es_developerportal_integrationguide_iframe_apirefrowlaunch5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowlaunch5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar función en el host`)
};

const fr_developerportal_integrationguide_iframe_apirefrowlaunch5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowlaunch5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lancer une fonctionnalité dans l'hôte`)
};

const ar_developerportal_integrationguide_iframe_apirefrowlaunch5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowlaunch5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشغيل ميزة في المضيف`)
};

/**
* | output |
* | --- |
* | "Launch feature in host" |
*
* @param {Developerportal_Integrationguide_Iframe_Apirefrowlaunch5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_apirefrowlaunch5 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Apirefrowlaunch5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Apirefrowlaunch5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_apirefrowlaunch5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_apirefrowlaunch5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_apirefrowlaunch5(inputs)
	return ar_developerportal_integrationguide_iframe_apirefrowlaunch5(inputs)
});
export { developerportal_integrationguide_iframe_apirefrowlaunch5 as "developerPortal.integrationGuide.iframe.apiRefRowLaunch" }