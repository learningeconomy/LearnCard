/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Testfailed4Inputs */

const en_developerportal_guides_serverwebhooks_teststep_testfailed4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Testfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send test event`)
};

const es_developerportal_guides_serverwebhooks_teststep_testfailed4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Testfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send test event`)
};

const fr_developerportal_guides_serverwebhooks_teststep_testfailed4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Testfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send test event`)
};

const ar_developerportal_guides_serverwebhooks_teststep_testfailed4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Testfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send test event`)
};

/**
* | output |
* | --- |
* | "Failed to send test event" |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Testfailed4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_testfailed4 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Testfailed4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Testfailed4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_testfailed4(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_testfailed4(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_testfailed4(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_testfailed4(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_testfailed4 as "developerPortal.guides.serverWebhooks.testStep.testFailed" }