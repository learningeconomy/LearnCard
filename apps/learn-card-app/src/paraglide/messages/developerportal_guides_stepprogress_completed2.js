/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Guides_Stepprogress_Completed2Inputs */

const en_developerportal_guides_stepprogress_completed2 = /** @type {(inputs: Developerportal_Guides_Stepprogress_Completed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} completed`)
};

const es_developerportal_guides_stepprogress_completed2 = /** @type {(inputs: Developerportal_Guides_Stepprogress_Completed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} completados`)
};

const fr_developerportal_guides_stepprogress_completed2 = /** @type {(inputs: Developerportal_Guides_Stepprogress_Completed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} terminés`)
};

const ar_developerportal_guides_stepprogress_completed2 = /** @type {(inputs: Developerportal_Guides_Stepprogress_Completed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} مكتملة`)
};

/**
* | output |
* | --- |
* | "{count} completed" |
*
* @param {Developerportal_Guides_Stepprogress_Completed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_stepprogress_completed2 = /** @type {((inputs: Developerportal_Guides_Stepprogress_Completed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Stepprogress_Completed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_stepprogress_completed2(inputs)
	if (locale === "es") return es_developerportal_guides_stepprogress_completed2(inputs)
	if (locale === "fr") return fr_developerportal_guides_stepprogress_completed2(inputs)
	return ar_developerportal_guides_stepprogress_completed2(inputs)
});
export { developerportal_guides_stepprogress_completed2 as "developerPortal.guides.stepProgress.completed" }