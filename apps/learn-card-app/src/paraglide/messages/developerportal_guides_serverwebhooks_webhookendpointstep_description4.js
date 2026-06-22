/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Description4Inputs */

const en_developerportal_guides_serverwebhooks_webhookendpointstep_description4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an HTTPS endpoint on your server that can receive POST requests from LearnCard.`)
};

const es_developerportal_guides_serverwebhooks_webhookendpointstep_description4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an HTTPS endpoint on your server that can receive POST requests from LearnCard.`)
};

const fr_developerportal_guides_serverwebhooks_webhookendpointstep_description4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an HTTPS endpoint on your server that can receive POST requests from LearnCard.`)
};

const ar_developerportal_guides_serverwebhooks_webhookendpointstep_description4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an HTTPS endpoint on your server that can receive POST requests from LearnCard.`)
};

/**
* | output |
* | --- |
* | "Create an HTTPS endpoint on your server that can receive POST requests from LearnCard." |
*
* @param {Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_webhookendpointstep_description4 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_webhookendpointstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_webhookendpointstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_webhookendpointstep_description4(inputs)
	return ar_developerportal_guides_serverwebhooks_webhookendpointstep_description4(inputs)
});
export { developerportal_guides_serverwebhooks_webhookendpointstep_description4 as "developerPortal.guides.serverWebhooks.webhookEndpointStep.description" }