/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Misc_Save3Inputs */

const en_passport_buildmylearncard_misc_save3 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Save3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save`)
};

const es_passport_buildmylearncard_misc_save3 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Save3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar`)
};

const fr_passport_buildmylearncard_misc_save3 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Save3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer`)
};

const ar_passport_buildmylearncard_misc_save3 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Save3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ`)
};

/**
* | output |
* | --- |
* | "Save" |
*
* @param {Passport_Buildmylearncard_Misc_Save3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_misc_save3 = /** @type {((inputs?: Passport_Buildmylearncard_Misc_Save3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Misc_Save3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_misc_save3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_misc_save3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_misc_save3(inputs)
	return ar_passport_buildmylearncard_misc_save3(inputs)
});
export { passport_buildmylearncard_misc_save3 as "passport.buildMyLearnCard.misc.save" }