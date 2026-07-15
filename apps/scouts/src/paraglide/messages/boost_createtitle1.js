/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boost_Createtitle1Inputs */

const en_boost_createtitle1 = /** @type {(inputs: Boost_Createtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Create a ${i?.title}`)
};

const es_boost_createtitle1 = /** @type {(inputs: Boost_Createtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Crear un ${i?.title}`)
};

const fr_boost_createtitle1 = /** @type {(inputs: Boost_Createtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créer un ${i?.title}`)
};

const ar_boost_createtitle1 = /** @type {(inputs: Boost_Createtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إنشاء ${i?.title}`)
};

/**
* | output |
* | --- |
* | "Create a {title}" |
*
* @param {Boost_Createtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_createtitle1 = /** @type {((inputs: Boost_Createtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Createtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_createtitle1(inputs)
	if (locale === "es") return es_boost_createtitle1(inputs)
	if (locale === "fr") return fr_boost_createtitle1(inputs)
	return ar_boost_createtitle1(inputs)
});
export { boost_createtitle1 as "boost.createTitle" }