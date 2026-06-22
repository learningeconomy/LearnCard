/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Dates_Expirationdate3Inputs */

const en_developerportal_credentialbuilder_dates_expirationdate3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration Date`)
};

const es_developerportal_credentialbuilder_dates_expirationdate3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de Vencimiento`)
};

const fr_developerportal_credentialbuilder_dates_expirationdate3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date d'Expiration`)
};

const ar_developerportal_credentialbuilder_dates_expirationdate3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الانتهاء`)
};

/**
* | output |
* | --- |
* | "Expiration Date" |
*
* @param {Developerportal_Credentialbuilder_Dates_Expirationdate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_dates_expirationdate3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Dates_Expirationdate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Dates_Expirationdate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_dates_expirationdate3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_dates_expirationdate3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_dates_expirationdate3(inputs)
	return ar_developerportal_credentialbuilder_dates_expirationdate3(inputs)
});
export { developerportal_credentialbuilder_dates_expirationdate3 as "developerPortal.credentialBuilder.dates.expirationDate" }