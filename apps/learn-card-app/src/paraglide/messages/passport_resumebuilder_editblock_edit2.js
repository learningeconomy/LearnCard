/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Editblock_Edit2Inputs */

const en_passport_resumebuilder_editblock_edit2 = /** @type {(inputs: Passport_Resumebuilder_Editblock_Edit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

const es_passport_resumebuilder_editblock_edit2 = /** @type {(inputs: Passport_Resumebuilder_Editblock_Edit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar`)
};

const fr_passport_resumebuilder_editblock_edit2 = /** @type {(inputs: Passport_Resumebuilder_Editblock_Edit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_passport_resumebuilder_editblock_edit2 = /** @type {(inputs: Passport_Resumebuilder_Editblock_Edit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل`)
};

/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Passport_Resumebuilder_Editblock_Edit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_editblock_edit2 = /** @type {((inputs?: Passport_Resumebuilder_Editblock_Edit2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Editblock_Edit2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_editblock_edit2(inputs)
	if (locale === "es") return es_passport_resumebuilder_editblock_edit2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_editblock_edit2(inputs)
	return ar_passport_resumebuilder_editblock_edit2(inputs)
});
export { passport_resumebuilder_editblock_edit2 as "passport.resumeBuilder.editBlock.edit" }