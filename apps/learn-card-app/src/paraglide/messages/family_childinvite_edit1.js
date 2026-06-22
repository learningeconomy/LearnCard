/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Family_Childinvite_Edit1Inputs */

const en_family_childinvite_edit1 = /** @type {(inputs: Family_Childinvite_Edit1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Edit ${i?.brand}`)
};

const es_family_childinvite_edit1 = /** @type {(inputs: Family_Childinvite_Edit1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Editar ${i?.brand}`)
};

const fr_family_childinvite_edit1 = /** @type {(inputs: Family_Childinvite_Edit1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Modifier ${i?.brand}`)
};

const ar_family_childinvite_edit1 = /** @type {(inputs: Family_Childinvite_Edit1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تعديل ${i?.brand}`)
};

/**
* | output |
* | --- |
* | "Edit {brand}" |
*
* @param {Family_Childinvite_Edit1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_childinvite_edit1 = /** @type {((inputs: Family_Childinvite_Edit1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Childinvite_Edit1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_childinvite_edit1(inputs)
	if (locale === "es") return es_family_childinvite_edit1(inputs)
	if (locale === "fr") return fr_family_childinvite_edit1(inputs)
	return ar_family_childinvite_edit1(inputs)
});
export { family_childinvite_edit1 as "family.childInvite.edit" }