/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Exporttocsv4Inputs */

const en_admintools_bulkimport_exporttocsv4 = /** @type {(inputs: Admintools_Bulkimport_Exporttocsv4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Export to CSV: File → Download → Comma Separated Values (.csv)`)
};

const es_admintools_bulkimport_exporttocsv4 = /** @type {(inputs: Admintools_Bulkimport_Exporttocsv4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Exportar a CSV: Archivo → Descargar → Valores Separados por Comas (.csv)`)
};

const fr_admintools_bulkimport_exporttocsv4 = /** @type {(inputs: Admintools_Bulkimport_Exporttocsv4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Exportez en CSV : Fichier → Télécharger → Valeurs séparées par des virgules (.csv)`)
};

const ar_admintools_bulkimport_exporttocsv4 = /** @type {(inputs: Admintools_Bulkimport_Exporttocsv4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Export to CSV: File → Download → Comma Separated Values (.csv)`)
};

/**
* | output |
* | --- |
* | "2. Export to CSV: File → Download → Comma Separated Values (.csv)" |
*
* @param {Admintools_Bulkimport_Exporttocsv4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_exporttocsv4 = /** @type {((inputs?: Admintools_Bulkimport_Exporttocsv4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Exporttocsv4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_exporttocsv4(inputs)
	if (locale === "es") return es_admintools_bulkimport_exporttocsv4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_exporttocsv4(inputs)
	return ar_admintools_bulkimport_exporttocsv4(inputs)
});
export { admintools_bulkimport_exporttocsv4 as "adminTools.bulkImport.exportToCsv" }