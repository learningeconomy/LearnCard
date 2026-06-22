/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Savechanges5Inputs */

const en_passport_buildmylearncard_editview_savechanges5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Savechanges5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Changes`)
};

const es_passport_buildmylearncard_editview_savechanges5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Savechanges5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar cambios`)
};

const fr_passport_buildmylearncard_editview_savechanges5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Savechanges5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer les modifications`)
};

const ar_passport_buildmylearncard_editview_savechanges5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Savechanges5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ التغييرات`)
};

/**
* | output |
* | --- |
* | "Save Changes" |
*
* @param {Passport_Buildmylearncard_Editview_Savechanges5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_savechanges5 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Savechanges5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Savechanges5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_savechanges5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_savechanges5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_savechanges5(inputs)
	return ar_passport_buildmylearncard_editview_savechanges5(inputs)
});
export { passport_buildmylearncard_editview_savechanges5 as "passport.buildMyLearnCard.editView.saveChanges" }