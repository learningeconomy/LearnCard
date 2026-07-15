/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Importingboosts3Inputs */

const en_admintools_bulkimport_importingboosts3 = /** @type {(inputs: Admintools_Bulkimport_Importingboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importing boosts ({created}/{total})...`)
};

const es_admintools_bulkimport_importingboosts3 = /** @type {(inputs: Admintools_Bulkimport_Importingboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importando boosts ({created}/{total})...`)
};

const fr_admintools_bulkimport_importingboosts3 = /** @type {(inputs: Admintools_Bulkimport_Importingboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importation des Boosts ({created}/{total})...`)
};

const ar_admintools_bulkimport_importingboosts3 = /** @type {(inputs: Admintools_Bulkimport_Importingboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري استيراد التعزيزات ({created}/{total})...`)
};

/**
* | output |
* | --- |
* | "Importing boosts ({created}/{total})..." |
*
* @param {Admintools_Bulkimport_Importingboosts3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_importingboosts3 = /** @type {((inputs?: Admintools_Bulkimport_Importingboosts3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Importingboosts3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_importingboosts3(inputs)
	if (locale === "es") return es_admintools_bulkimport_importingboosts3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_importingboosts3(inputs)
	return ar_admintools_bulkimport_importingboosts3(inputs)
});
export { admintools_bulkimport_importingboosts3 as "adminTools.bulkImport.importingBoosts" }