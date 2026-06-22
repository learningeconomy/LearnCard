/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Dates_Removeexpiration3Inputs */

const en_developerportal_credentialbuilder_dates_removeexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Removeexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove Expiration`)
};

const es_developerportal_credentialbuilder_dates_removeexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Removeexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Vencimiento`)
};

const fr_developerportal_credentialbuilder_dates_removeexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Removeexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer l'Expiration`)
};

const ar_developerportal_credentialbuilder_dates_removeexpiration3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Removeexpiration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة الانتهاء`)
};

/**
* | output |
* | --- |
* | "Remove Expiration" |
*
* @param {Developerportal_Credentialbuilder_Dates_Removeexpiration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_dates_removeexpiration3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Dates_Removeexpiration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Dates_Removeexpiration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_dates_removeexpiration3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_dates_removeexpiration3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_dates_removeexpiration3(inputs)
	return ar_developerportal_credentialbuilder_dates_removeexpiration3(inputs)
});
export { developerportal_credentialbuilder_dates_removeexpiration3 as "developerPortal.credentialBuilder.dates.removeExpiration" }