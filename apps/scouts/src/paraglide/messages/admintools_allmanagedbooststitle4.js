/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Allmanagedbooststitle4Inputs */

const en_admintools_allmanagedbooststitle4 = /** @type {(inputs: Admintools_Allmanagedbooststitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Managed Boosts and Badges`)
};

const es_admintools_allmanagedbooststitle4 = /** @type {(inputs: Admintools_Allmanagedbooststitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos los Boosts e Insignias Gestionados`)
};

const fr_admintools_allmanagedbooststitle4 = /** @type {(inputs: Admintools_Allmanagedbooststitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les Boosts et badges gérés`)
};

const ar_admintools_allmanagedbooststitle4 = /** @type {(inputs: Admintools_Allmanagedbooststitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Managed Boosts and Badges`)
};

/**
* | output |
* | --- |
* | "All Managed Boosts and Badges" |
*
* @param {Admintools_Allmanagedbooststitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_allmanagedbooststitle4 = /** @type {((inputs?: Admintools_Allmanagedbooststitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Allmanagedbooststitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_allmanagedbooststitle4(inputs)
	if (locale === "es") return es_admintools_allmanagedbooststitle4(inputs)
	if (locale === "fr") return fr_admintools_allmanagedbooststitle4(inputs)
	return ar_admintools_allmanagedbooststitle4(inputs)
});
export { admintools_allmanagedbooststitle4 as "adminTools.allManagedBoostsTitle" }