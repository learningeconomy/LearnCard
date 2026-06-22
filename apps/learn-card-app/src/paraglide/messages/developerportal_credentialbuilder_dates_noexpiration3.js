/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Dates_Noexpiration3Inputs */

const en_developerportal_credentialbuilder_dates_noexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Noexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No expiration date - credential will be valid indefinitely`)
};

const es_developerportal_credentialbuilder_dates_noexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Noexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin fecha de vencimiento — la credencial será válida indefinidamente`)
};

const fr_developerportal_credentialbuilder_dates_noexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Noexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas de date d'expiration — le crédential sera valide indéfiniment`)
};

const ar_developerportal_credentialbuilder_dates_noexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Noexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد تاريخ انتهاء — سيكون الاعتماد صالحًا إلى أجل غير مسمى`)
};

/**
* | output |
* | --- |
* | "No expiration date - credential will be valid indefinitely" |
*
* @param {Developerportal_Credentialbuilder_Dates_Noexpiration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_dates_noexpiration3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Dates_Noexpiration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Dates_Noexpiration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_dates_noexpiration3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_dates_noexpiration3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_dates_noexpiration3(inputs)
	return ar_developerportal_credentialbuilder_dates_noexpiration3(inputs)
});
export { developerportal_credentialbuilder_dates_noexpiration3 as "developerPortal.credentialBuilder.dates.noExpiration" }