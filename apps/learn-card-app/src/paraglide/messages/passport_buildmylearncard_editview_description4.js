/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Description4Inputs */

const en_passport_buildmylearncard_editview_description4 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

const es_passport_buildmylearncard_editview_description4 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descripción`)
};

const fr_passport_buildmylearncard_editview_description4 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

const ar_passport_buildmylearncard_editview_description4 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوصف`)
};

/**
* | output |
* | --- |
* | "Description" |
*
* @param {Passport_Buildmylearncard_Editview_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_description4 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_description4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_description4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_description4(inputs)
	return ar_passport_buildmylearncard_editview_description4(inputs)
});
export { passport_buildmylearncard_editview_description4 as "passport.buildMyLearnCard.editView.description" }