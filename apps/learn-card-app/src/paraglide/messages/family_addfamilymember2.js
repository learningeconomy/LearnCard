/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Addfamilymember2Inputs */

const en_family_addfamilymember2 = /** @type {(inputs: Family_Addfamilymember2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Family Member`)
};

const es_family_addfamilymember2 = /** @type {(inputs: Family_Addfamilymember2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar miembro de la familia`)
};

const fr_family_addfamilymember2 = /** @type {(inputs: Family_Addfamilymember2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un membre de la famille`)
};

const ar_family_addfamilymember2 = /** @type {(inputs: Family_Addfamilymember2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة فرد من العائلة`)
};

/**
* | output |
* | --- |
* | "Add Family Member" |
*
* @param {Family_Addfamilymember2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_addfamilymember2 = /** @type {((inputs?: Family_Addfamilymember2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Addfamilymember2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_addfamilymember2(inputs)
	if (locale === "es") return es_family_addfamilymember2(inputs)
	if (locale === "fr") return fr_family_addfamilymember2(inputs)
	return ar_family_addfamilymember2(inputs)
});
export { family_addfamilymember2 as "family.addFamilyMember" }