/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Steps_Createendpoint3Inputs */

const en_developerportal_guides_serverwebhooks_steps_createendpoint3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Steps_Createendpoint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Endpoint`)
};

const es_developerportal_guides_serverwebhooks_steps_createendpoint3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Steps_Createendpoint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Endpoint`)
};

const fr_developerportal_guides_serverwebhooks_steps_createendpoint3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Steps_Createendpoint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Endpoint`)
};

const ar_developerportal_guides_serverwebhooks_steps_createendpoint3 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Steps_Createendpoint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Endpoint`)
};

/**
* | output |
* | --- |
* | "Create Endpoint" |
*
* @param {Developerportal_Guides_Serverwebhooks_Steps_Createendpoint3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_steps_createendpoint3 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Steps_Createendpoint3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Steps_Createendpoint3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_steps_createendpoint3(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_steps_createendpoint3(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_steps_createendpoint3(inputs)
	return ar_developerportal_guides_serverwebhooks_steps_createendpoint3(inputs)
});
export { developerportal_guides_serverwebhooks_steps_createendpoint3 as "developerPortal.guides.serverWebhooks.steps.createEndpoint" }