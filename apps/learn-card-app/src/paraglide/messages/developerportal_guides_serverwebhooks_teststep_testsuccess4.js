/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Testsuccess4Inputs */

const en_developerportal_guides_serverwebhooks_teststep_testsuccess4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Testsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test event sent! Check your server logs.`)
};

const es_developerportal_guides_serverwebhooks_teststep_testsuccess4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Testsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test event sent! Check your server logs.`)
};

const fr_developerportal_guides_serverwebhooks_teststep_testsuccess4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Testsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test event sent! Check your server logs.`)
};

const ar_developerportal_guides_serverwebhooks_teststep_testsuccess4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Testsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test event sent! Check your server logs.`)
};

/**
* | output |
* | --- |
* | "Test event sent! Check your server logs." |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Testsuccess4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_testsuccess4 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Testsuccess4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Testsuccess4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_testsuccess4(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_testsuccess4(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_testsuccess4(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_testsuccess4(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_testsuccess4 as "developerPortal.guides.serverWebhooks.testStep.testSuccess" }