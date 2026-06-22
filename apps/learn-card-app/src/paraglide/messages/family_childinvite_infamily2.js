/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown>, family: NonNullable<unknown> }} Family_Childinvite_Infamily2Inputs */

const en_family_childinvite_infamily2 = /** @type {(inputs: Family_Childinvite_Infamily2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} in ${i?.family}`)
};

const es_family_childinvite_infamily2 = /** @type {(inputs: Family_Childinvite_Infamily2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} en ${i?.family}`)
};

const fr_family_childinvite_infamily2 = /** @type {(inputs: Family_Childinvite_Infamily2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} dans ${i?.family}`)
};

const ar_family_childinvite_infamily2 = /** @type {(inputs: Family_Childinvite_Infamily2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} في ${i?.family}`)
};

/**
* | output |
* | --- |
* | "{title} in {family}" |
*
* @param {Family_Childinvite_Infamily2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_childinvite_infamily2 = /** @type {((inputs: Family_Childinvite_Infamily2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Childinvite_Infamily2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_childinvite_infamily2(inputs)
	if (locale === "es") return es_family_childinvite_infamily2(inputs)
	if (locale === "fr") return fr_family_childinvite_infamily2(inputs)
	return ar_family_childinvite_infamily2(inputs)
});
export { family_childinvite_infamily2 as "family.childInvite.inFamily" }