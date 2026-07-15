/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Simplefilenames3Inputs */

const en_admintools_bulkimport_simplefilenames3 = /** @type {(inputs: Admintools_Bulkimport_Simplefilenames3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OR simple filenames (image.png) for images you'll upload in a ZIP`)
};

const es_admintools_bulkimport_simplefilenames3 = /** @type {(inputs: Admintools_Bulkimport_Simplefilenames3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`O nombres de archivo simples (image.png) para imágenes que subirás en un ZIP`)
};

const fr_admintools_bulkimport_simplefilenames3 = /** @type {(inputs: Admintools_Bulkimport_Simplefilenames3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OU des noms de fichier simples (image.png) pour les images que vous téléchargerez dans un ZIP`)
};

const ar_admintools_bulkimport_simplefilenames3 = /** @type {(inputs: Admintools_Bulkimport_Simplefilenames3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OR simple filenames (image.png) for images you'll upload in a ZIP`)
};

/**
* | output |
* | --- |
* | "OR simple filenames (image.png) for images you'll upload in a ZIP" |
*
* @param {Admintools_Bulkimport_Simplefilenames3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_simplefilenames3 = /** @type {((inputs?: Admintools_Bulkimport_Simplefilenames3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Simplefilenames3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_simplefilenames3(inputs)
	if (locale === "es") return es_admintools_bulkimport_simplefilenames3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_simplefilenames3(inputs)
	return ar_admintools_bulkimport_simplefilenames3(inputs)
});
export { admintools_bulkimport_simplefilenames3 as "adminTools.bulkImport.simpleFilenames" }