/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Dates_Expirationhelp3Inputs */

const en_developerportal_credentialbuilder_dates_expirationhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When the credential expires (optional, ISO 8601 format)`)
};

const es_developerportal_credentialbuilder_dates_expirationhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuándo vence la credencial (opcional, formato ISO 8601)`)
};

const fr_developerportal_credentialbuilder_dates_expirationhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quand le crédential expire (optionnel, format ISO 8601)`)
};

const ar_developerportal_credentialbuilder_dates_expirationhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متى تنتهي صلاحية الاعتماد (اختياري، تنسيق ISO 8601)`)
};

/**
* | output |
* | --- |
* | "When the credential expires (optional, ISO 8601 format)" |
*
* @param {Developerportal_Credentialbuilder_Dates_Expirationhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_dates_expirationhelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Dates_Expirationhelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Dates_Expirationhelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_dates_expirationhelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_dates_expirationhelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_dates_expirationhelp3(inputs)
	return ar_developerportal_credentialbuilder_dates_expirationhelp3(inputs)
});
export { developerportal_credentialbuilder_dates_expirationhelp3 as "developerPortal.credentialBuilder.dates.expirationHelp" }