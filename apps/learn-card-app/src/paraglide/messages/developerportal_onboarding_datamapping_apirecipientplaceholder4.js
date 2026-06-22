/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Apirecipientplaceholder4Inputs */

const en_developerportal_onboarding_datamapping_apirecipientplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apirecipientplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`recipient@example.com`)
};

const es_developerportal_onboarding_datamapping_apirecipientplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apirecipientplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`destinatario@ejemplo.com`)
};

const fr_developerportal_onboarding_datamapping_apirecipientplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apirecipientplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`destinataire@exemple.com`)
};

const ar_developerportal_onboarding_datamapping_apirecipientplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apirecipientplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستلم@مثال.com`)
};

/**
* | output |
* | --- |
* | "recipient@example.com" |
*
* @param {Developerportal_Onboarding_Datamapping_Apirecipientplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_apirecipientplaceholder4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Apirecipientplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Apirecipientplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_apirecipientplaceholder4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_apirecipientplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_apirecipientplaceholder4(inputs)
	return ar_developerportal_onboarding_datamapping_apirecipientplaceholder4(inputs)
});
export { developerportal_onboarding_datamapping_apirecipientplaceholder4 as "developerPortal.onboarding.dataMapping.apiRecipientPlaceholder" }