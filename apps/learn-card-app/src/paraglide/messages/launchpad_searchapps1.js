/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Searchapps1Inputs */

const en_launchpad_searchapps1 = /** @type {(inputs: Launchpad_Searchapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search apps...`)
};

const es_launchpad_searchapps1 = /** @type {(inputs: Launchpad_Searchapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar aplicaciones...`)
};

const fr_launchpad_searchapps1 = /** @type {(inputs: Launchpad_Searchapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des applications...`)
};

const ar_launchpad_searchapps1 = /** @type {(inputs: Launchpad_Searchapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث عن التطبيقات...`)
};

/**
* | output |
* | --- |
* | "Search apps..." |
*
* @param {Launchpad_Searchapps1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_searchapps1 = /** @type {((inputs?: Launchpad_Searchapps1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Searchapps1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_searchapps1(inputs)
	if (locale === "es") return es_launchpad_searchapps1(inputs)
	if (locale === "fr") return fr_launchpad_searchapps1(inputs)
	return ar_launchpad_searchapps1(inputs)
});
export { launchpad_searchapps1 as "launchpad.searchApps" }