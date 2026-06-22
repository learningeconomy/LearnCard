/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Passport_Buildmylearncard_Demoschool_Deletedcount5Inputs */

const en_passport_buildmylearncard_demoschool_deletedcount5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Deletedcount5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Deleted ${i?.count} Demo credentials`)
};

const es_passport_buildmylearncard_demoschool_deletedcount5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Deletedcount5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Se eliminaron ${i?.count} credenciales de demostración`)
};

const fr_passport_buildmylearncard_demoschool_deletedcount5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Deletedcount5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} références de démonstration supprimées`)
};

const ar_passport_buildmylearncard_demoschool_deletedcount5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Deletedcount5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم حذف ${i?.count} اعتماد تجريبي`)
};

/**
* | output |
* | --- |
* | "Deleted {count} Demo credentials" |
*
* @param {Passport_Buildmylearncard_Demoschool_Deletedcount5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_demoschool_deletedcount5 = /** @type {((inputs: Passport_Buildmylearncard_Demoschool_Deletedcount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Demoschool_Deletedcount5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_demoschool_deletedcount5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_demoschool_deletedcount5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_demoschool_deletedcount5(inputs)
	return ar_passport_buildmylearncard_demoschool_deletedcount5(inputs)
});
export { passport_buildmylearncard_demoschool_deletedcount5 as "passport.buildMyLearnCard.demoSchool.deletedCount" }