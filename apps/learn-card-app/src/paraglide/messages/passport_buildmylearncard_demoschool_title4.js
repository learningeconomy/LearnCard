/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Demoschool_Title4Inputs */

const en_passport_buildmylearncard_demoschool_title4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demo School`)
};

const es_passport_buildmylearncard_demoschool_title4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escuela de demostración`)
};

const fr_passport_buildmylearncard_demoschool_title4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`École de démonstration`)
};

const ar_passport_buildmylearncard_demoschool_title4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مدرسة تجريبية`)
};

/**
* | output |
* | --- |
* | "Demo School" |
*
* @param {Passport_Buildmylearncard_Demoschool_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_demoschool_title4 = /** @type {((inputs?: Passport_Buildmylearncard_Demoschool_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Demoschool_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_demoschool_title4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_demoschool_title4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_demoschool_title4(inputs)
	return ar_passport_buildmylearncard_demoschool_title4(inputs)
});
export { passport_buildmylearncard_demoschool_title4 as "passport.buildMyLearnCard.demoSchool.title" }