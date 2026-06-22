/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ query: NonNullable<unknown> }} Passport_Resumebuilder_Selector_Nomatch2Inputs */

const en_passport_resumebuilder_selector_nomatch2 = /** @type {(inputs: Passport_Resumebuilder_Selector_Nomatch2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`No credentials match "${i?.query}".`)
};

const es_passport_resumebuilder_selector_nomatch2 = /** @type {(inputs: Passport_Resumebuilder_Selector_Nomatch2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ninguna credencial coincide con "${i?.query}".`)
};

const fr_passport_resumebuilder_selector_nomatch2 = /** @type {(inputs: Passport_Resumebuilder_Selector_Nomatch2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Aucun titre ne correspond à « ${i?.query} ».`)
};

const ar_passport_resumebuilder_selector_nomatch2 = /** @type {(inputs: Passport_Resumebuilder_Selector_Nomatch2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لا توجد شهادات تطابق "${i?.query}".`)
};

/**
* | output |
* | --- |
* | "No credentials match \"{query}\"." |
*
* @param {Passport_Resumebuilder_Selector_Nomatch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_selector_nomatch2 = /** @type {((inputs: Passport_Resumebuilder_Selector_Nomatch2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Selector_Nomatch2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_selector_nomatch2(inputs)
	if (locale === "es") return es_passport_resumebuilder_selector_nomatch2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_selector_nomatch2(inputs)
	return ar_passport_resumebuilder_selector_nomatch2(inputs)
});
export { passport_resumebuilder_selector_nomatch2 as "passport.resumeBuilder.selector.noMatch" }