/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Handleeventsstep_Codepaneltitle6Inputs */

const en_developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Codepaneltitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Event Handler`)
};

const es_developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Codepaneltitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Event Handler`)
};

const fr_developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Codepaneltitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Event Handler`)
};

const ar_developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Codepaneltitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Event Handler`)
};

/**
* | output |
* | --- |
* | "Event Handler" |
*
* @param {Developerportal_Guides_Serverwebhooks_Handleeventsstep_Codepaneltitle6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Handleeventsstep_Codepaneltitle6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Handleeventsstep_Codepaneltitle6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6(inputs)
	return ar_developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6(inputs)
});
export { developerportal_guides_serverwebhooks_handleeventsstep_codepaneltitle6 as "developerPortal.guides.serverWebhooks.handleEventsStep.codePanelTitle" }