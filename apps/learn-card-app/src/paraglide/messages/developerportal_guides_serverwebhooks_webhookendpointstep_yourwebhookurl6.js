/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Yourwebhookurl6Inputs */

const en_developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Yourwebhookurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Webhook URL`)
};

const es_developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Yourwebhookurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu URL de Webhook`)
};

const fr_developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Yourwebhookurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre URL de Webhook`)
};

const ar_developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Yourwebhookurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط الويب هوك الخاص بك`)
};

/**
* | output |
* | --- |
* | "Your Webhook URL" |
*
* @param {Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Yourwebhookurl6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Yourwebhookurl6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Yourwebhookurl6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6(inputs)
	return ar_developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6(inputs)
});
export { developerportal_guides_serverwebhooks_webhookendpointstep_yourwebhookurl6 as "developerPortal.guides.serverWebhooks.webhookEndpointStep.yourWebhookUrl" }