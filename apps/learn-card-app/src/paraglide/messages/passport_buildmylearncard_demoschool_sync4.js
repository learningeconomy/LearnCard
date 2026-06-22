/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Demoschool_Sync4Inputs */

const en_passport_buildmylearncard_demoschool_sync4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Sync4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sync Demo School`)
};

const es_passport_buildmylearncard_demoschool_sync4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Sync4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincronizar escuela de demostración`)
};

const fr_passport_buildmylearncard_demoschool_sync4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Sync4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchroniser l’école de démonstration`)
};

const ar_passport_buildmylearncard_demoschool_sync4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Sync4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مزامنة المدرسة التجريبية`)
};

/**
* | output |
* | --- |
* | "Sync Demo School" |
*
* @param {Passport_Buildmylearncard_Demoschool_Sync4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_demoschool_sync4 = /** @type {((inputs?: Passport_Buildmylearncard_Demoschool_Sync4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Demoschool_Sync4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_demoschool_sync4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_demoschool_sync4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_demoschool_sync4(inputs)
	return ar_passport_buildmylearncard_demoschool_sync4(inputs)
});
export { passport_buildmylearncard_demoschool_sync4 as "passport.buildMyLearnCard.demoSchool.sync" }