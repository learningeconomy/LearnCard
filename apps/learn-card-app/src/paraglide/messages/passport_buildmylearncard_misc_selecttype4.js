/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Misc_Selecttype4Inputs */

const en_passport_buildmylearncard_misc_selecttype4 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Selecttype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select type...`)
};

const es_passport_buildmylearncard_misc_selecttype4 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Selecttype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar tipo...`)
};

const fr_passport_buildmylearncard_misc_selecttype4 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Selecttype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un type...`)
};

const ar_passport_buildmylearncard_misc_selecttype4 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Selecttype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر النوع...`)
};

/**
* | output |
* | --- |
* | "Select type..." |
*
* @param {Passport_Buildmylearncard_Misc_Selecttype4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_misc_selecttype4 = /** @type {((inputs?: Passport_Buildmylearncard_Misc_Selecttype4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Misc_Selecttype4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_misc_selecttype4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_misc_selecttype4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_misc_selecttype4(inputs)
	return ar_passport_buildmylearncard_misc_selecttype4(inputs)
});
export { passport_buildmylearncard_misc_selecttype4 as "passport.buildMyLearnCard.misc.selectType" }