/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Deleteboost1Inputs */

const en_boost_deleteboost1 = /** @type {(inputs: Boost_Deleteboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Boost`)
};

const es_boost_deleteboost1 = /** @type {(inputs: Boost_Deleteboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Boost`)
};

const fr_boost_deleteboost1 = /** @type {(inputs: Boost_Deleteboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le Boost`)
};

const ar_boost_deleteboost1 = /** @type {(inputs: Boost_Deleteboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف الترقية`)
};

/**
* | output |
* | --- |
* | "Delete Boost" |
*
* @param {Boost_Deleteboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_deleteboost1 = /** @type {((inputs?: Boost_Deleteboost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Deleteboost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_deleteboost1(inputs)
	if (locale === "es") return es_boost_deleteboost1(inputs)
	if (locale === "fr") return fr_boost_deleteboost1(inputs)
	return ar_boost_deleteboost1(inputs)
});
export { boost_deleteboost1 as "boost.deleteBoost" }