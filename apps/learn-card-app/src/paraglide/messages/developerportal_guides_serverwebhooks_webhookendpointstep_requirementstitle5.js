/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Requirementstitle5Inputs */

const en_developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Requirementstitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requirements`)
};

const es_developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Requirementstitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requirements`)
};

const fr_developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Requirementstitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requirements`)
};

const ar_developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Requirementstitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requirements`)
};

/**
* | output |
* | --- |
* | "Requirements" |
*
* @param {Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Requirementstitle5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Requirementstitle5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Requirementstitle5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5(inputs)
	return ar_developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5(inputs)
});
export { developerportal_guides_serverwebhooks_webhookendpointstep_requirementstitle5 as "developerPortal.guides.serverWebhooks.webhookEndpointStep.requirementsTitle" }