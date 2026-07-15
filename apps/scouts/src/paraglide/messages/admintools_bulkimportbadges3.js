/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimportbadges3Inputs */

const en_admintools_bulkimportbadges3 = /** @type {(inputs: Admintools_Bulkimportbadges3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bulk Import Badges + Boosts`)
};

const es_admintools_bulkimportbadges3 = /** @type {(inputs: Admintools_Bulkimportbadges3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importación Masiva de Insignias + Boosts`)
};

const fr_admintools_bulkimportbadges3 = /** @type {(inputs: Admintools_Bulkimportbadges3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importation en masse de badges et Boosts`)
};

const ar_admintools_bulkimportbadges3 = /** @type {(inputs: Admintools_Bulkimportbadges3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد الشارات + التعزيزات بالجملة`)
};

/**
* | output |
* | --- |
* | "Bulk Import Badges + Boosts" |
*
* @param {Admintools_Bulkimportbadges3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimportbadges3 = /** @type {((inputs?: Admintools_Bulkimportbadges3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimportbadges3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimportbadges3(inputs)
	if (locale === "es") return es_admintools_bulkimportbadges3(inputs)
	if (locale === "fr") return fr_admintools_bulkimportbadges3(inputs)
	return ar_admintools_bulkimportbadges3(inputs)
});
export { admintools_bulkimportbadges3 as "adminTools.bulkImportBadges" }