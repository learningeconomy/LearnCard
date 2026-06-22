/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Dates_Issuancedate3Inputs */

const en_developerportal_credentialbuilder_dates_issuancedate3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Issuancedate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuance Date`)
};

const es_developerportal_credentialbuilder_dates_issuancedate3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Issuancedate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de Emisión`)
};

const fr_developerportal_credentialbuilder_dates_issuancedate3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Issuancedate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date d'Émission`)
};

const ar_developerportal_credentialbuilder_dates_issuancedate3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Issuancedate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الإصدار`)
};

/**
* | output |
* | --- |
* | "Issuance Date" |
*
* @param {Developerportal_Credentialbuilder_Dates_Issuancedate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_dates_issuancedate3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Dates_Issuancedate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Dates_Issuancedate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_dates_issuancedate3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_dates_issuancedate3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_dates_issuancedate3(inputs)
	return ar_developerportal_credentialbuilder_dates_issuancedate3(inputs)
});
export { developerportal_credentialbuilder_dates_issuancedate3 as "developerPortal.credentialBuilder.dates.issuanceDate" }