/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Childinvite_Taglinelabel2Inputs */

const en_family_childinvite_taglinelabel2 = /** @type {(inputs: Family_Childinvite_Taglinelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tagline`)
};

const es_family_childinvite_taglinelabel2 = /** @type {(inputs: Family_Childinvite_Taglinelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lema`)
};

const fr_family_childinvite_taglinelabel2 = /** @type {(inputs: Family_Childinvite_Taglinelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Slogan`)
};

const ar_family_childinvite_taglinelabel2 = /** @type {(inputs: Family_Childinvite_Taglinelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشعار`)
};

/**
* | output |
* | --- |
* | "Tagline" |
*
* @param {Family_Childinvite_Taglinelabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_childinvite_taglinelabel2 = /** @type {((inputs?: Family_Childinvite_Taglinelabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Childinvite_Taglinelabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_childinvite_taglinelabel2(inputs)
	if (locale === "es") return es_family_childinvite_taglinelabel2(inputs)
	if (locale === "fr") return fr_family_childinvite_taglinelabel2(inputs)
	return ar_family_childinvite_taglinelabel2(inputs)
});
export { family_childinvite_taglinelabel2 as "family.childInvite.taglineLabel" }