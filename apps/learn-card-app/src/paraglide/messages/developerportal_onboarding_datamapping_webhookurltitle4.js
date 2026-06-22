/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Webhookurltitle4Inputs */

const en_developerportal_onboarding_datamapping_webhookurltitle4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Webhookurltitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Webhook URL`)
};

const es_developerportal_onboarding_datamapping_webhookurltitle4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Webhookurltitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL del Webhook`)
};

const fr_developerportal_onboarding_datamapping_webhookurltitle4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Webhookurltitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL du Webhook`)
};

const ar_developerportal_onboarding_datamapping_webhookurltitle4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Webhookurltitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان URL للWebhook`)
};

/**
* | output |
* | --- |
* | "Webhook URL" |
*
* @param {Developerportal_Onboarding_Datamapping_Webhookurltitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_webhookurltitle4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Webhookurltitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Webhookurltitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_webhookurltitle4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_webhookurltitle4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_webhookurltitle4(inputs)
	return ar_developerportal_onboarding_datamapping_webhookurltitle4(inputs)
});
export { developerportal_onboarding_datamapping_webhookurltitle4 as "developerPortal.onboarding.dataMapping.webhookUrlTitle" }