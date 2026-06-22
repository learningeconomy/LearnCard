/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Csvuploaddesc4Inputs */

const en_developerportal_onboarding_datamapping_csvuploaddesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvuploaddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload a CSV to see file headers and map columns to credential fields.`)
};

const es_developerportal_onboarding_datamapping_csvuploaddesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvuploaddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube un CSV para ver los encabezados y mapear columnas a campos de credencial.`)
};

const fr_developerportal_onboarding_datamapping_csvuploaddesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvuploaddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez un CSV pour voir les en-têtes et mapper les colonnes aux champs de credential.`)
};

const ar_developerportal_onboarding_datamapping_csvuploaddesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvuploaddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم برفع CSV لرؤوس الملفات وتخطيط الأعمدة لحقول بيانات الاعتماد.`)
};

/**
* | output |
* | --- |
* | "Upload a CSV to see file headers and map columns to credential fields." |
*
* @param {Developerportal_Onboarding_Datamapping_Csvuploaddesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_csvuploaddesc4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Csvuploaddesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Csvuploaddesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_csvuploaddesc4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_csvuploaddesc4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_csvuploaddesc4(inputs)
	return ar_developerportal_onboarding_datamapping_csvuploaddesc4(inputs)
});
export { developerportal_onboarding_datamapping_csvuploaddesc4 as "developerPortal.onboarding.dataMapping.csvUploadDesc" }