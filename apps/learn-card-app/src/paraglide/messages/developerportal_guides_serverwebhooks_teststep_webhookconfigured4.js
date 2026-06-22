/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Webhookconfigured4Inputs */

const en_developerportal_guides_serverwebhooks_teststep_webhookconfigured4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Webhookconfigured4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Webhook URL configured`)
};

const es_developerportal_guides_serverwebhooks_teststep_webhookconfigured4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Webhookconfigured4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Webhook URL configured`)
};

const fr_developerportal_guides_serverwebhooks_teststep_webhookconfigured4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Webhookconfigured4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Webhook URL configured`)
};

const ar_developerportal_guides_serverwebhooks_teststep_webhookconfigured4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Webhookconfigured4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Webhook URL configured`)
};

/**
* | output |
* | --- |
* | "Webhook URL configured" |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Webhookconfigured4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_webhookconfigured4 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Webhookconfigured4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Webhookconfigured4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_webhookconfigured4(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_webhookconfigured4(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_webhookconfigured4(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_webhookconfigured4(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_webhookconfigured4 as "developerPortal.guides.serverWebhooks.testStep.webhookConfigured" }