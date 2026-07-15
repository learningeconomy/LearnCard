/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Searchnetwork4Inputs */

const en_boostcms_searchnetwork4 = /** @type {(inputs: Boostcms_Searchnetwork4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search ScoutPass Network...`)
};

const es_boostcms_searchnetwork4 = /** @type {(inputs: Boostcms_Searchnetwork4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar en la Red ScoutPass...`)
};

const fr_boostcms_searchnetwork4 = /** @type {(inputs: Boostcms_Searchnetwork4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher sur le réseau ScoutPass...`)
};

const ar_boostcms_searchnetwork4 = /** @type {(inputs: Boostcms_Searchnetwork4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search ScoutPass Network...`)
};

/**
* | output |
* | --- |
* | "Search ScoutPass Network..." |
*
* @param {Boostcms_Searchnetwork4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_searchnetwork4 = /** @type {((inputs?: Boostcms_Searchnetwork4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Searchnetwork4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_searchnetwork4(inputs)
	if (locale === "es") return es_boostcms_searchnetwork4(inputs)
	if (locale === "fr") return fr_boostcms_searchnetwork4(inputs)
	return ar_boostcms_searchnetwork4(inputs)
});
export { boostcms_searchnetwork4 as "boostCMS.searchNetwork" }