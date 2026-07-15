/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Memberslist_Searchplaceholder2Inputs */

const en_troops_memberslist_searchplaceholder2 = /** @type {(inputs: Troops_Memberslist_Searchplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search...`)
};

const es_troops_memberslist_searchplaceholder2 = /** @type {(inputs: Troops_Memberslist_Searchplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar...`)
};

const fr_troops_memberslist_searchplaceholder2 = /** @type {(inputs: Troops_Memberslist_Searchplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher...`)
};

const ar_troops_memberslist_searchplaceholder2 = /** @type {(inputs: Troops_Memberslist_Searchplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بحث...`)
};

/**
* | output |
* | --- |
* | "Search..." |
*
* @param {Troops_Memberslist_Searchplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_memberslist_searchplaceholder2 = /** @type {((inputs?: Troops_Memberslist_Searchplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Memberslist_Searchplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_memberslist_searchplaceholder2(inputs)
	if (locale === "es") return es_troops_memberslist_searchplaceholder2(inputs)
	if (locale === "fr") return fr_troops_memberslist_searchplaceholder2(inputs)
	return ar_troops_memberslist_searchplaceholder2(inputs)
});
export { troops_memberslist_searchplaceholder2 as "troops.membersList.searchPlaceholder" }