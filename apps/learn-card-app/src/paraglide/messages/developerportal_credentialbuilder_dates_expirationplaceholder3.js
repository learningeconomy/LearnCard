/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Dates_Expirationplaceholder3Inputs */

const en_developerportal_credentialbuilder_dates_expirationplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2025-01-15T00:00:00Z`)
};

const es_developerportal_credentialbuilder_dates_expirationplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2025-01-15T00:00:00Z`)
};

const fr_developerportal_credentialbuilder_dates_expirationplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2025-01-15T00:00:00Z`)
};

const ar_developerportal_credentialbuilder_dates_expirationplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Dates_Expirationplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2025-01-15T00:00:00Z`)
};

/**
* | output |
* | --- |
* | "2025-01-15T00:00:00Z" |
*
* @param {Developerportal_Credentialbuilder_Dates_Expirationplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_dates_expirationplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Dates_Expirationplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Dates_Expirationplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_dates_expirationplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_dates_expirationplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_dates_expirationplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_dates_expirationplaceholder3(inputs)
});
export { developerportal_credentialbuilder_dates_expirationplaceholder3 as "developerPortal.credentialBuilder.dates.expirationPlaceholder" }