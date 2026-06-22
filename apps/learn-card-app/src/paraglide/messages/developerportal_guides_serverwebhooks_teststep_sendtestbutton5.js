/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Teststep_Sendtestbutton5Inputs */

const en_developerportal_guides_serverwebhooks_teststep_sendtestbutton5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendtestbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test`)
};

const es_developerportal_guides_serverwebhooks_teststep_sendtestbutton5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendtestbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test`)
};

const fr_developerportal_guides_serverwebhooks_teststep_sendtestbutton5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendtestbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test`)
};

const ar_developerportal_guides_serverwebhooks_teststep_sendtestbutton5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Teststep_Sendtestbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test`)
};

/**
* | output |
* | --- |
* | "Send Test" |
*
* @param {Developerportal_Guides_Serverwebhooks_Teststep_Sendtestbutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_teststep_sendtestbutton5 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Teststep_Sendtestbutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Teststep_Sendtestbutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_teststep_sendtestbutton5(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_teststep_sendtestbutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_teststep_sendtestbutton5(inputs)
	return ar_developerportal_guides_serverwebhooks_teststep_sendtestbutton5(inputs)
});
export { developerportal_guides_serverwebhooks_teststep_sendtestbutton5 as "developerPortal.guides.serverWebhooks.testStep.sendTestButton" }