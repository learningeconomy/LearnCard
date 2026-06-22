/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Steps_Handleevents3Inputs */

const en_developerportal_guides_serverwebhooks_steps_handleevents3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Steps_Handleevents3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Handle Events`)
};

const es_developerportal_guides_serverwebhooks_steps_handleevents3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Steps_Handleevents3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Handle Events`)
};

const fr_developerportal_guides_serverwebhooks_steps_handleevents3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Steps_Handleevents3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Handle Events`)
};

const ar_developerportal_guides_serverwebhooks_steps_handleevents3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Steps_Handleevents3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Handle Events`)
};

/**
* | output |
* | --- |
* | "Handle Events" |
*
* @param {Developerportal_Guides_Serverwebhooks_Steps_Handleevents3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_steps_handleevents3 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Steps_Handleevents3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Steps_Handleevents3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_steps_handleevents3(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_steps_handleevents3(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_steps_handleevents3(inputs)
	return ar_developerportal_guides_serverwebhooks_steps_handleevents3(inputs)
});
export { developerportal_guides_serverwebhooks_steps_handleevents3 as "developerPortal.guides.serverWebhooks.steps.handleEvents" }