/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Childinvite_Doblabel2Inputs */

const en_family_childinvite_doblabel2 = /** @type {(inputs: Family_Childinvite_Doblabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date of Birth`)
};

const es_family_childinvite_doblabel2 = /** @type {(inputs: Family_Childinvite_Doblabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de nacimiento`)
};

const fr_family_childinvite_doblabel2 = /** @type {(inputs: Family_Childinvite_Doblabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de naissance`)
};

const ar_family_childinvite_doblabel2 = /** @type {(inputs: Family_Childinvite_Doblabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الميلاد`)
};

/**
* | output |
* | --- |
* | "Date of Birth" |
*
* @param {Family_Childinvite_Doblabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_childinvite_doblabel2 = /** @type {((inputs?: Family_Childinvite_Doblabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Childinvite_Doblabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_childinvite_doblabel2(inputs)
	if (locale === "es") return es_family_childinvite_doblabel2(inputs)
	if (locale === "fr") return fr_family_childinvite_doblabel2(inputs)
	return ar_family_childinvite_doblabel2(inputs)
});
export { family_childinvite_doblabel2 as "family.childInvite.dobLabel" }