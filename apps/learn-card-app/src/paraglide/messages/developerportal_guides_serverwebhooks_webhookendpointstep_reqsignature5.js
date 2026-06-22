/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqsignature5Inputs */

const en_developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqsignature5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify the signature header`)
};

const es_developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqsignature5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify the signature header`)
};

const fr_developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqsignature5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify the signature header`)
};

const ar_developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqsignature5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify the signature header`)
};

/**
* | output |
* | --- |
* | "Verify the signature header" |
*
* @param {Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqsignature5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqsignature5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Webhookendpointstep_Reqsignature5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5(inputs)
	return ar_developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5(inputs)
});
export { developerportal_guides_serverwebhooks_webhookendpointstep_reqsignature5 as "developerPortal.guides.serverWebhooks.webhookEndpointStep.reqSignature" }