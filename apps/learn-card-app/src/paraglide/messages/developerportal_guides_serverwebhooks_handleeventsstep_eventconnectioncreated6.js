/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconnectioncreated6Inputs */

const en_developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconnectioncreated6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New connection established`)
};

const es_developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconnectioncreated6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New connection established`)
};

const fr_developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconnectioncreated6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New connection established`)
};

const ar_developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconnectioncreated6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New connection established`)
};

/**
* | output |
* | --- |
* | "New connection established" |
*
* @param {Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconnectioncreated6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconnectioncreated6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventconnectioncreated6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6(inputs)
	return ar_developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6(inputs)
});
export { developerportal_guides_serverwebhooks_handleeventsstep_eventconnectioncreated6 as "developerPortal.guides.serverWebhooks.handleEventsStep.eventConnectionCreated" }