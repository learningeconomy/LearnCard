/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Childinvite_Selectcountry2Inputs */

const en_family_childinvite_selectcountry2 = /** @type {(inputs: Family_Childinvite_Selectcountry2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Country`)
};

const es_family_childinvite_selectcountry2 = /** @type {(inputs: Family_Childinvite_Selectcountry2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar país`)
};

const fr_family_childinvite_selectcountry2 = /** @type {(inputs: Family_Childinvite_Selectcountry2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un pays`)
};

const ar_family_childinvite_selectcountry2 = /** @type {(inputs: Family_Childinvite_Selectcountry2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر الدولة`)
};

/**
* | output |
* | --- |
* | "Select Country" |
*
* @param {Family_Childinvite_Selectcountry2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_childinvite_selectcountry2 = /** @type {((inputs?: Family_Childinvite_Selectcountry2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Childinvite_Selectcountry2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_childinvite_selectcountry2(inputs)
	if (locale === "es") return es_family_childinvite_selectcountry2(inputs)
	if (locale === "fr") return fr_family_childinvite_selectcountry2(inputs)
	return ar_family_childinvite_selectcountry2(inputs)
});
export { family_childinvite_selectcountry2 as "family.childInvite.selectCountry" }