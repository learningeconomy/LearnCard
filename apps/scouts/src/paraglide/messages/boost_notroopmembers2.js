/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Notroopmembers2Inputs */

const en_boost_notroopmembers2 = /** @type {(inputs: Boost_Notroopmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No troop members`)
};

const es_boost_notroopmembers2 = /** @type {(inputs: Boost_Notroopmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin miembros del troop`)
};

const fr_boost_notroopmembers2 = /** @type {(inputs: Boost_Notroopmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun membre de la troupe`)
};

const ar_boost_notroopmembers2 = /** @type {(inputs: Boost_Notroopmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد أعضاء فرقة`)
};

/**
* | output |
* | --- |
* | "No troop members" |
*
* @param {Boost_Notroopmembers2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_notroopmembers2 = /** @type {((inputs?: Boost_Notroopmembers2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Notroopmembers2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_notroopmembers2(inputs)
	if (locale === "es") return es_boost_notroopmembers2(inputs)
	if (locale === "fr") return fr_boost_notroopmembers2(inputs)
	return ar_boost_notroopmembers2(inputs)
});
export { boost_notroopmembers2 as "boost.noTroopMembers" }