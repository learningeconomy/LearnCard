/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Members_Searchplh1Inputs */

const en_troops_members_searchplh1 = /** @type {(inputs: Troops_Members_Searchplh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search...`)
};

const es_troops_members_searchplh1 = /** @type {(inputs: Troops_Members_Searchplh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar...`)
};

const fr_troops_members_searchplh1 = /** @type {(inputs: Troops_Members_Searchplh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher...`)
};

const ar_troops_members_searchplh1 = /** @type {(inputs: Troops_Members_Searchplh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search...`)
};

/**
* | output |
* | --- |
* | "Search..." |
*
* @param {Troops_Members_Searchplh1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_members_searchplh1 = /** @type {((inputs?: Troops_Members_Searchplh1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Members_Searchplh1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_members_searchplh1(inputs)
	if (locale === "es") return es_troops_members_searchplh1(inputs)
	if (locale === "fr") return fr_troops_members_searchplh1(inputs)
	return ar_troops_members_searchplh1(inputs)
});
export { troops_members_searchplh1 as "troops.members.searchPlh" }