/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Csvrecipientfielddesc5Inputs */

const en_developerportal_onboarding_datamapping_csvrecipientfielddesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvrecipientfielddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select the column containing recipient identifiers (email, phone, or profile ID).`)
};

const es_developerportal_onboarding_datamapping_csvrecipientfielddesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvrecipientfielddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona la columna que contiene los identificadores del destinatario (email, teléfono o ID de perfil).`)
};

const fr_developerportal_onboarding_datamapping_csvrecipientfielddesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvrecipientfielddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez la colonne contenant les identifiants du destinataire (email, téléphone ou ID de profil).`)
};

const ar_developerportal_onboarding_datamapping_csvrecipientfielddesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvrecipientfielddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدد العمود الذي يحتوي على معرفات المستلم (البريد الإلكتروني أو الهاتف أو معرف الملف الشخصي).`)
};

/**
* | output |
* | --- |
* | "Select the column containing recipient identifiers (email, phone, or profile ID)." |
*
* @param {Developerportal_Onboarding_Datamapping_Csvrecipientfielddesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_csvrecipientfielddesc5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Csvrecipientfielddesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Csvrecipientfielddesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_csvrecipientfielddesc5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_csvrecipientfielddesc5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_csvrecipientfielddesc5(inputs)
	return ar_developerportal_onboarding_datamapping_csvrecipientfielddesc5(inputs)
});
export { developerportal_onboarding_datamapping_csvrecipientfielddesc5 as "developerPortal.onboarding.dataMapping.csvRecipientFieldDesc" }