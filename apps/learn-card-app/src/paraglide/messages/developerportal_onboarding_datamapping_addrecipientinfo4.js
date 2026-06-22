/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Addrecipientinfo4Inputs */

const en_developerportal_onboarding_datamapping_addrecipientinfo4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Addrecipientinfo4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add recipient info and credential data for each row`)
};

const es_developerportal_onboarding_datamapping_addrecipientinfo4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Addrecipientinfo4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add recipient info and credential data for each row`)
};

const fr_developerportal_onboarding_datamapping_addrecipientinfo4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Addrecipientinfo4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add recipient info and credential data for each row`)
};

const ar_developerportal_onboarding_datamapping_addrecipientinfo4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Addrecipientinfo4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add recipient info and credential data for each row`)
};

/**
* | output |
* | --- |
* | "Add recipient info and credential data for each row" |
*
* @param {Developerportal_Onboarding_Datamapping_Addrecipientinfo4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_addrecipientinfo4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Addrecipientinfo4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Addrecipientinfo4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_addrecipientinfo4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_addrecipientinfo4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_addrecipientinfo4(inputs)
	return ar_developerportal_onboarding_datamapping_addrecipientinfo4(inputs)
});
export { developerportal_onboarding_datamapping_addrecipientinfo4 as "developerPortal.onboarding.dataMapping.addRecipientInfo" }