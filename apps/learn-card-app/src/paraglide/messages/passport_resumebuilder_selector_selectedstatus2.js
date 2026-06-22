/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, status: NonNullable<unknown> }} Passport_Resumebuilder_Selector_Selectedstatus2Inputs */

const en_passport_resumebuilder_selector_selectedstatus2 = /** @type {(inputs: Passport_Resumebuilder_Selector_Selectedstatus2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Selected • ${i?.status}`)
};

const es_passport_resumebuilder_selector_selectedstatus2 = /** @type {(inputs: Passport_Resumebuilder_Selector_Selectedstatus2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} seleccionadas • ${i?.status}`)
};

const fr_passport_resumebuilder_selector_selectedstatus2 = /** @type {(inputs: Passport_Resumebuilder_Selector_Selectedstatus2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} sélectionné(s) • ${i?.status}`)
};

const ar_passport_resumebuilder_selector_selectedstatus2 = /** @type {(inputs: Passport_Resumebuilder_Selector_Selectedstatus2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} محددة • ${i?.status}`)
};

/**
* | output |
* | --- |
* | "{count} Selected • {status}" |
*
* @param {Passport_Resumebuilder_Selector_Selectedstatus2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_selector_selectedstatus2 = /** @type {((inputs: Passport_Resumebuilder_Selector_Selectedstatus2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Selector_Selectedstatus2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_selector_selectedstatus2(inputs)
	if (locale === "es") return es_passport_resumebuilder_selector_selectedstatus2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_selector_selectedstatus2(inputs)
	return ar_passport_resumebuilder_selector_selectedstatus2(inputs)
});
export { passport_resumebuilder_selector_selectedstatus2 as "passport.resumeBuilder.selector.selectedStatus" }