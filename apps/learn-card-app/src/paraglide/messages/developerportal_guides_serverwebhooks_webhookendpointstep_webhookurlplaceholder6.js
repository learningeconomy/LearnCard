/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Webhookurlplaceholder6Inputs */

const en_developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Webhookurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://your-server.com/webhooks/learncard`)
};

const es_developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Webhookurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://your-server.com/webhooks/learncard`)
};

const fr_developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Webhookurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://your-server.com/webhooks/learncard`)
};

const ar_developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Webhookurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://your-server.com/webhooks/learncard`)
};

/**
* | output |
* | --- |
* | "https://your-server.com/webhooks/learncard" |
*
* @param {Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Webhookurlplaceholder6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Webhookurlplaceholder6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Webhookurlplaceholder6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6(inputs)
	return ar_developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6(inputs)
});
export { developerportal_guides_serverwebhooks_webhookendpointstep_webhookurlplaceholder6 as "developerPortal.guides.serverWebhooks.webhookEndpointStep.webhookUrlPlaceholder" }