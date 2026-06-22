/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Childinvite_Namelabel2Inputs */

const en_family_childinvite_namelabel2 = /** @type {(inputs: Family_Childinvite_Namelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const es_family_childinvite_namelabel2 = /** @type {(inputs: Family_Childinvite_Namelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre`)
};

const fr_family_childinvite_namelabel2 = /** @type {(inputs: Family_Childinvite_Namelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom`)
};

const ar_family_childinvite_namelabel2 = /** @type {(inputs: Family_Childinvite_Namelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم`)
};

/**
* | output |
* | --- |
* | "Name" |
*
* @param {Family_Childinvite_Namelabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_childinvite_namelabel2 = /** @type {((inputs?: Family_Childinvite_Namelabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Childinvite_Namelabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_childinvite_namelabel2(inputs)
	if (locale === "es") return es_family_childinvite_namelabel2(inputs)
	if (locale === "fr") return fr_family_childinvite_namelabel2(inputs)
	return ar_family_childinvite_namelabel2(inputs)
});
export { family_childinvite_namelabel2 as "family.childInvite.nameLabel" }