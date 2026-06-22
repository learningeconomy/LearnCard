/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Nowebhookurl5Inputs */

const en_developerportal_guides_serverwebhooks_teststep_nowebhookurl5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Nowebhookurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No webhook URL set`)
};

const es_developerportal_guides_serverwebhooks_teststep_nowebhookurl5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Nowebhookurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No webhook URL set`)
};

const fr_developerportal_guides_serverwebhooks_teststep_nowebhookurl5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Nowebhookurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No webhook URL set`)
};

const ar_developerportal_guides_serverwebhooks_teststep_nowebhookurl5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Nowebhookurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No webhook URL set`)
};

/**
* | output |
* | --- |
* | "No webhook URL set" |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Nowebhookurl5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_nowebhookurl5 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Nowebhookurl5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Nowebhookurl5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_nowebhookurl5(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_nowebhookurl5(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_nowebhookurl5(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_nowebhookurl5(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_nowebhookurl5 as "developerPortal.guides.serverWebhooks.testStep.noWebhookUrl" }