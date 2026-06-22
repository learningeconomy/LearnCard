/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Dates_Issuancedatehelp4Inputs */

const en_developerportal_credentialbuilder_dates_issuancedatehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Issuancedatehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatically set to the current date/time when the credential is issued`)
};

const es_developerportal_credentialbuilder_dates_issuancedatehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Issuancedatehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se establece automáticamente a la fecha/hora actual cuando se emite la credencial`)
};

const fr_developerportal_credentialbuilder_dates_issuancedatehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Issuancedatehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatiquement définie à la date/heure actuelle lors de l'émission du crédential`)
};

const ar_developerportal_credentialbuilder_dates_issuancedatehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Issuancedatehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتم تعيينه تلقائيًا للتاريخ/الوقت الحالي عند إصدار الاعتماد`)
};

/**
* | output |
* | --- |
* | "Automatically set to the current date/time when the credential is issued" |
*
* @param {Developerportal_Credentialbuilder_Dates_Issuancedatehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_dates_issuancedatehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Dates_Issuancedatehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Dates_Issuancedatehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_dates_issuancedatehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_dates_issuancedatehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_dates_issuancedatehelp4(inputs)
	return ar_developerportal_credentialbuilder_dates_issuancedatehelp4(inputs)
});
export { developerportal_credentialbuilder_dates_issuancedatehelp4 as "developerPortal.credentialBuilder.dates.issuanceDateHelp" }