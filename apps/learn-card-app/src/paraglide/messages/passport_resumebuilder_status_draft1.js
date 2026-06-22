/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Status_Draft1Inputs */

const en_passport_resumebuilder_status_draft1 = /** @type {(inputs: Passport_Resumebuilder_Status_Draft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Draft`)
};

const es_passport_resumebuilder_status_draft1 = /** @type {(inputs: Passport_Resumebuilder_Status_Draft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Borrador`)
};

const fr_passport_resumebuilder_status_draft1 = /** @type {(inputs: Passport_Resumebuilder_Status_Draft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brouillon`)
};

const ar_passport_resumebuilder_status_draft1 = /** @type {(inputs: Passport_Resumebuilder_Status_Draft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسودة`)
};

/**
* | output |
* | --- |
* | "Draft" |
*
* @param {Passport_Resumebuilder_Status_Draft1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_status_draft1 = /** @type {((inputs?: Passport_Resumebuilder_Status_Draft1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Status_Draft1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_status_draft1(inputs)
	if (locale === "es") return es_passport_resumebuilder_status_draft1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_status_draft1(inputs)
	return ar_passport_resumebuilder_status_draft1(inputs)
});
export { passport_resumebuilder_status_draft1 as "passport.resumeBuilder.status.draft" }