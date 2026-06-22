/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqresponsetime6Inputs */

const en_developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqresponsetime6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Respond within 30 seconds`)
};

const es_developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqresponsetime6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Respond within 30 seconds`)
};

const fr_developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqresponsetime6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Respond within 30 seconds`)
};

const ar_developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqresponsetime6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Respond within 30 seconds`)
};

/**
* | output |
* | --- |
* | "Respond within 30 seconds" |
*
* @param {Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqresponsetime6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqresponsetime6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqresponsetime6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6(inputs)
	return ar_developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6(inputs)
});
export { developerportal_guides_serverwebhooks_webhookendpointstep_reqresponsetime6 as "developerPortal.guides.serverWebhooks.webhookEndpointStep.reqResponseTime" }