/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Selector_Next1Inputs */

const en_passport_resumebuilder_selector_next1 = /** @type {(inputs: Passport_Resumebuilder_Selector_Next1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Next credential`)
};

const es_passport_resumebuilder_selector_next1 = /** @type {(inputs: Passport_Resumebuilder_Selector_Next1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Siguiente credencial`)
};

const fr_passport_resumebuilder_selector_next1 = /** @type {(inputs: Passport_Resumebuilder_Selector_Next1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre suivant`)
};

const ar_passport_resumebuilder_selector_next1 = /** @type {(inputs: Passport_Resumebuilder_Selector_Next1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشهادة التالية`)
};

/**
* | output |
* | --- |
* | "Next credential" |
*
* @param {Passport_Resumebuilder_Selector_Next1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_selector_next1 = /** @type {((inputs?: Passport_Resumebuilder_Selector_Next1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Selector_Next1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_selector_next1(inputs)
	if (locale === "es") return es_passport_resumebuilder_selector_next1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_selector_next1(inputs)
	return ar_passport_resumebuilder_selector_next1(inputs)
});
export { passport_resumebuilder_selector_next1 as "passport.resumeBuilder.selector.next" }