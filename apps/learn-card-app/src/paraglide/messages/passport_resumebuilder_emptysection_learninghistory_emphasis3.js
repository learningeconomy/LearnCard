/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Emptysection_Learninghistory_Emphasis3Inputs */

const en_passport_resumebuilder_emptysection_learninghistory_emphasis3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Learninghistory_Emphasis3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Studies`)
};

const es_passport_resumebuilder_emptysection_learninghistory_emphasis3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Learninghistory_Emphasis3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade estudios`)
};

const fr_passport_resumebuilder_emptysection_learninghistory_emphasis3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Learninghistory_Emphasis3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez des formations`)
};

const ar_passport_resumebuilder_emptysection_learninghistory_emphasis3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Learninghistory_Emphasis3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف دراسات`)
};

/**
* | output |
* | --- |
* | "Add Studies" |
*
* @param {Passport_Resumebuilder_Emptysection_Learninghistory_Emphasis3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_emptysection_learninghistory_emphasis3 = /** @type {((inputs?: Passport_Resumebuilder_Emptysection_Learninghistory_Emphasis3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Emptysection_Learninghistory_Emphasis3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_emptysection_learninghistory_emphasis3(inputs)
	if (locale === "es") return es_passport_resumebuilder_emptysection_learninghistory_emphasis3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_emptysection_learninghistory_emphasis3(inputs)
	return ar_passport_resumebuilder_emptysection_learninghistory_emphasis3(inputs)
});
export { passport_resumebuilder_emptysection_learninghistory_emphasis3 as "passport.resumeBuilder.emptySection.learningHistory.emphasis" }