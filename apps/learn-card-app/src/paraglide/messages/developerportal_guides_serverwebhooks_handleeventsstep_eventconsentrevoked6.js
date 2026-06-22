/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentrevoked6Inputs */

const en_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentrevoked6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User revoked consent`)
};

const es_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentrevoked6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User revoked consent`)
};

const fr_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentrevoked6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User revoked consent`)
};

const ar_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentrevoked6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User revoked consent`)
};

/**
* | output |
* | --- |
* | "User revoked consent" |
*
* @param {Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentrevoked6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentrevoked6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconsentrevoked6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6(inputs)
	return ar_developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6(inputs)
});
export { developerportal_guides_serverwebhooks_handleeventsstep_eventconsentrevoked6 as "developerPortal.guides.serverWebhooks.handleEventsStep.eventConsentRevoked" }