/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Apirefrowidentity5Inputs */

const en_developerportal_integrationguide_iframe_apirefrowidentity5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowidentity5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request user identity (SSO)`)
};

const es_developerportal_integrationguide_iframe_apirefrowidentity5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowidentity5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar identidad del usuario (SSO)`)
};

const fr_developerportal_integrationguide_iframe_apirefrowidentity5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowidentity5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander l'identité de l'utilisateur (SSO)`)
};

const ar_developerportal_integrationguide_iframe_apirefrowidentity5 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowidentity5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب هوية المستخدم (SSO)`)
};

/**
* | output |
* | --- |
* | "Request user identity (SSO)" |
*
* @param {Developerportal_Integrationguide_Iframe_Apirefrowidentity5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_apirefrowidentity5 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Apirefrowidentity5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Apirefrowidentity5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_apirefrowidentity5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_apirefrowidentity5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_apirefrowidentity5(inputs)
	return ar_developerportal_integrationguide_iframe_apirefrowidentity5(inputs)
});
export { developerportal_integrationguide_iframe_apirefrowidentity5 as "developerPortal.integrationGuide.iframe.apiRefRowIdentity" }