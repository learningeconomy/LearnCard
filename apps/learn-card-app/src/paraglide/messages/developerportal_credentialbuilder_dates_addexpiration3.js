/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Dates_Addexpiration3Inputs */

const en_developerportal_credentialbuilder_dates_addexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Addexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Expiration`)
};

const es_developerportal_credentialbuilder_dates_addexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Addexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Vencimiento`)
};

const fr_developerportal_credentialbuilder_dates_addexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Addexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une Expiration`)
};

const ar_developerportal_credentialbuilder_dates_addexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Addexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة انتهاء`)
};

/**
* | output |
* | --- |
* | "Add Expiration" |
*
* @param {Developerportal_Credentialbuilder_Dates_Addexpiration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_dates_addexpiration3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Dates_Addexpiration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Dates_Addexpiration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_dates_addexpiration3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_dates_addexpiration3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_dates_addexpiration3(inputs)
	return ar_developerportal_credentialbuilder_dates_addexpiration3(inputs)
});
export { developerportal_credentialbuilder_dates_addexpiration3 as "developerPortal.credentialBuilder.dates.addExpiration" }