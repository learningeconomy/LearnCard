/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Description3Inputs */

const en_developerportal_guides_serverwebhooks_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make sure your webhook endpoint is working correctly before going live.`)
};

const es_developerportal_guides_serverwebhooks_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make sure your webhook endpoint is working correctly before going live.`)
};

const fr_developerportal_guides_serverwebhooks_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make sure your webhook endpoint is working correctly before going live.`)
};

const ar_developerportal_guides_serverwebhooks_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make sure your webhook endpoint is working correctly before going live.`)
};

/**
* | output |
* | --- |
* | "Make sure your webhook endpoint is working correctly before going live." |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_description3 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_description3(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_description3(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_description3(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_description3 as "developerPortal.guides.serverWebhooks.testStep.description" }