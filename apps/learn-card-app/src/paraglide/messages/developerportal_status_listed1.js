/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Status_Listed1Inputs */

const en_developerportal_status_listed1 = /** @type {(inputs: Developerportal_Status_Listed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listed`)
};

const es_developerportal_status_listed1 = /** @type {(inputs: Developerportal_Status_Listed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listed`)
};

const fr_developerportal_status_listed1 = /** @type {(inputs: Developerportal_Status_Listed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listed`)
};

const ar_developerportal_status_listed1 = /** @type {(inputs: Developerportal_Status_Listed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listed`)
};

/**
* | output |
* | --- |
* | "Listed" |
*
* @param {Developerportal_Status_Listed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_status_listed1 = /** @type {((inputs?: Developerportal_Status_Listed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Status_Listed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_status_listed1(inputs)
	if (locale === "es") return es_developerportal_status_listed1(inputs)
	if (locale === "fr") return fr_developerportal_status_listed1(inputs)
	return ar_developerportal_status_listed1(inputs)
});
export { developerportal_status_listed1 as "developerPortal.status.listed" }