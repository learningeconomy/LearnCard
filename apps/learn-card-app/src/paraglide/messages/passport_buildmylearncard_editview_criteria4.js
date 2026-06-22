/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Criteria4Inputs */

const en_passport_buildmylearncard_editview_criteria4 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Criteria4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criteria`)
};

const es_passport_buildmylearncard_editview_criteria4 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Criteria4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criterios`)
};

const fr_passport_buildmylearncard_editview_criteria4 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Criteria4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Critères`)
};

const ar_passport_buildmylearncard_editview_criteria4 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Criteria4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعايير`)
};

/**
* | output |
* | --- |
* | "Criteria" |
*
* @param {Passport_Buildmylearncard_Editview_Criteria4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_criteria4 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Criteria4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Criteria4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_criteria4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_criteria4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_criteria4(inputs)
	return ar_passport_buildmylearncard_editview_criteria4(inputs)
});
export { passport_buildmylearncard_editview_criteria4 as "passport.buildMyLearnCard.editView.criteria" }