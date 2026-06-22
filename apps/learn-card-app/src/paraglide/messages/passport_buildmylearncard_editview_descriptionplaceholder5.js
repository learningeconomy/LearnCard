/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Descriptionplaceholder5Inputs */

const en_passport_buildmylearncard_editview_descriptionplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Descriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a description...`)
};

const es_passport_buildmylearncard_editview_descriptionplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Descriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade una descripción...`)
};

const fr_passport_buildmylearncard_editview_descriptionplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Descriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez une description...`)
};

const ar_passport_buildmylearncard_editview_descriptionplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Descriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف وصفاً...`)
};

/**
* | output |
* | --- |
* | "Add a description..." |
*
* @param {Passport_Buildmylearncard_Editview_Descriptionplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_descriptionplaceholder5 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Descriptionplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Descriptionplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_descriptionplaceholder5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_descriptionplaceholder5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_descriptionplaceholder5(inputs)
	return ar_passport_buildmylearncard_editview_descriptionplaceholder5(inputs)
});
export { passport_buildmylearncard_editview_descriptionplaceholder5 as "passport.buildMyLearnCard.editView.descriptionPlaceholder" }