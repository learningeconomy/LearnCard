/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Misc_Saving3Inputs */

const en_passport_buildmylearncard_misc_saving3 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_passport_buildmylearncard_misc_saving3 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando...`)
};

const fr_passport_buildmylearncard_misc_saving3 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement...`)
};

const ar_passport_buildmylearncard_misc_saving3 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الحفظ...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Passport_Buildmylearncard_Misc_Saving3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_misc_saving3 = /** @type {((inputs?: Passport_Buildmylearncard_Misc_Saving3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Misc_Saving3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_misc_saving3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_misc_saving3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_misc_saving3(inputs)
	return ar_passport_buildmylearncard_misc_saving3(inputs)
});
export { passport_buildmylearncard_misc_saving3 as "passport.buildMyLearnCard.misc.saving" }