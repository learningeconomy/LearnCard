/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentgranted6Inputs */

const en_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentgranted6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User granted consent to a contract`)
};

const es_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentgranted6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User granted consent to a contract`)
};

const fr_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentgranted6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User granted consent to a contract`)
};

const ar_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentgranted6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User granted consent to a contract`)
};

/**
* | output |
* | --- |
* | "User granted consent to a contract" |
*
* @param {Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentgranted6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentgranted6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentgranted6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6(inputs)
	return ar_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6(inputs)
});
export { developerportal_guides_serverwebhooks_handleeventsstep_eventconsentgranted6 as "developerPortal.guides.serverWebhooks.handleEventsStep.eventConsentGranted" }