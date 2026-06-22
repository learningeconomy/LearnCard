/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Readydescription4Inputs */

const en_developerportal_guides_serverwebhooks_teststep_readydescription4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Readydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server can now receive real-time events from LearnCard.`)
};

const es_developerportal_guides_serverwebhooks_teststep_readydescription4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Readydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server can now receive real-time events from LearnCard.`)
};

const fr_developerportal_guides_serverwebhooks_teststep_readydescription4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Readydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server can now receive real-time events from LearnCard.`)
};

const ar_developerportal_guides_serverwebhooks_teststep_readydescription4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Readydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server can now receive real-time events from LearnCard.`)
};

/**
* | output |
* | --- |
* | "Your server can now receive real-time events from LearnCard." |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Readydescription4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_readydescription4 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Readydescription4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Readydescription4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_readydescription4(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_readydescription4(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_readydescription4(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_readydescription4(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_readydescription4 as "developerPortal.guides.serverWebhooks.testStep.readyDescription" }