/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Csvrecipientfield4Inputs */

const en_developerportal_onboarding_datamapping_csvrecipientfield4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvrecipientfield4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient Column`)
};

const es_developerportal_onboarding_datamapping_csvrecipientfield4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvrecipientfield4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Columna de Destinatario`)
};

const fr_developerportal_onboarding_datamapping_csvrecipientfield4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvrecipientfield4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colonne Destinataire`)
};

const ar_developerportal_onboarding_datamapping_csvrecipientfield4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvrecipientfield4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عمود المستلم`)
};

/**
* | output |
* | --- |
* | "Recipient Column" |
*
* @param {Developerportal_Onboarding_Datamapping_Csvrecipientfield4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_csvrecipientfield4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Csvrecipientfield4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Csvrecipientfield4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_csvrecipientfield4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_csvrecipientfield4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_csvrecipientfield4(inputs)
	return ar_developerportal_onboarding_datamapping_csvrecipientfield4(inputs)
});
export { developerportal_onboarding_datamapping_csvrecipientfield4 as "developerPortal.onboarding.dataMapping.csvRecipientField" }