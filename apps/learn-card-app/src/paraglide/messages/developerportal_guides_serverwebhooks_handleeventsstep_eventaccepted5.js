/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventaccepted5Inputs */

const en_developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventaccepted5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User accepted a credential`)
};

const es_developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventaccepted5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User accepted a credential`)
};

const fr_developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventaccepted5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User accepted a credential`)
};

const ar_developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventaccepted5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User accepted a credential`)
};

/**
* | output |
* | --- |
* | "User accepted a credential" |
*
* @param {Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventaccepted5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventaccepted5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Handleeventsstep_Eventaccepted5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5(inputs)
	return ar_developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5(inputs)
});
export { developerportal_guides_serverwebhooks_handleeventsstep_eventaccepted5 as "developerPortal.guides.serverWebhooks.handleEventsStep.eventAccepted" }