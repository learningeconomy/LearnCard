/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Sendingbutton4Inputs */

const en_developerportal_guides_serverwebhooks_teststep_sendingbutton4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendingbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const es_developerportal_guides_serverwebhooks_teststep_sendingbutton4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendingbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const fr_developerportal_guides_serverwebhooks_teststep_sendingbutton4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendingbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const ar_developerportal_guides_serverwebhooks_teststep_sendingbutton4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendingbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Sendingbutton4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_sendingbutton4 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Sendingbutton4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Sendingbutton4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_sendingbutton4(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_sendingbutton4(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_sendingbutton4(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_sendingbutton4(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_sendingbutton4 as "developerPortal.guides.serverWebhooks.testStep.sendingButton" }