/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Childinvite_Countrylabel2Inputs */

const en_family_childinvite_countrylabel2 = /** @type {(inputs: Family_Childinvite_Countrylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Country (Optional)`)
};

const es_family_childinvite_countrylabel2 = /** @type {(inputs: Family_Childinvite_Countrylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`País (opcional)`)
};

const fr_family_childinvite_countrylabel2 = /** @type {(inputs: Family_Childinvite_Countrylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pays (facultatif)`)
};

const ar_family_childinvite_countrylabel2 = /** @type {(inputs: Family_Childinvite_Countrylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدولة (اختياري)`)
};

/**
* | output |
* | --- |
* | "Country (Optional)" |
*
* @param {Family_Childinvite_Countrylabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_childinvite_countrylabel2 = /** @type {((inputs?: Family_Childinvite_Countrylabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Childinvite_Countrylabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_childinvite_countrylabel2(inputs)
	if (locale === "es") return es_family_childinvite_countrylabel2(inputs)
	if (locale === "fr") return fr_family_childinvite_countrylabel2(inputs)
	return ar_family_childinvite_countrylabel2(inputs)
});
export { family_childinvite_countrylabel2 as "family.childInvite.countryLabel" }