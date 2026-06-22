/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Sendtesttitle5Inputs */

const en_developerportal_guides_serverwebhooks_teststep_sendtesttitle5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendtesttitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test Event`)
};

const es_developerportal_guides_serverwebhooks_teststep_sendtesttitle5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendtesttitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test Event`)
};

const fr_developerportal_guides_serverwebhooks_teststep_sendtesttitle5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendtesttitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test Event`)
};

const ar_developerportal_guides_serverwebhooks_teststep_sendtesttitle5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendtesttitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test Event`)
};

/**
* | output |
* | --- |
* | "Send Test Event" |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Sendtesttitle5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_sendtesttitle5 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Sendtesttitle5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Sendtesttitle5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_sendtesttitle5(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_sendtesttitle5(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_sendtesttitle5(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_sendtesttitle5(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_sendtesttitle5 as "developerPortal.guides.serverWebhooks.testStep.sendTestTitle" }