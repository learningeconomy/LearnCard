/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Fulldocs4Inputs */

const en_developerportal_guides_serverwebhooks_teststep_fulldocs4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Fulldocs4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Documentation`)
};

const es_developerportal_guides_serverwebhooks_teststep_fulldocs4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Fulldocs4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Documentation`)
};

const fr_developerportal_guides_serverwebhooks_teststep_fulldocs4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Fulldocs4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Documentation`)
};

const ar_developerportal_guides_serverwebhooks_teststep_fulldocs4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Fulldocs4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Documentation`)
};

/**
* | output |
* | --- |
* | "Full Documentation" |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Fulldocs4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_fulldocs4 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Fulldocs4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Fulldocs4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_fulldocs4(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_fulldocs4(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_fulldocs4(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_fulldocs4(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_fulldocs4 as "developerPortal.guides.serverWebhooks.testStep.fullDocs" }