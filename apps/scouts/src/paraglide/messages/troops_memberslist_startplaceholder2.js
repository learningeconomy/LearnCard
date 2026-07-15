/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Memberslist_Startplaceholder2Inputs */

const en_troops_memberslist_startplaceholder2 = /** @type {(inputs: Troops_Memberslist_Startplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search network titles...`)
};

const es_troops_memberslist_startplaceholder2 = /** @type {(inputs: Troops_Memberslist_Startplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar títulos de red...`)
};

const fr_troops_memberslist_startplaceholder2 = /** @type {(inputs: Troops_Memberslist_Startplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des titres du réseau...`)
};

const ar_troops_memberslist_startplaceholder2 = /** @type {(inputs: Troops_Memberslist_Startplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بحث عن عناوين الشبكة...`)
};

/**
* | output |
* | --- |
* | "Search network titles..." |
*
* @param {Troops_Memberslist_Startplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_memberslist_startplaceholder2 = /** @type {((inputs?: Troops_Memberslist_Startplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Memberslist_Startplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_memberslist_startplaceholder2(inputs)
	if (locale === "es") return es_troops_memberslist_startplaceholder2(inputs)
	if (locale === "fr") return fr_troops_memberslist_startplaceholder2(inputs)
	return ar_troops_memberslist_startplaceholder2(inputs)
});
export { troops_memberslist_startplaceholder2 as "troops.membersList.startPlaceholder" }