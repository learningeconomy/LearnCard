/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Foundzipimages4Inputs */

const en_admintools_bulkimport_foundzipimages4 = /** @type {(inputs: Admintools_Bulkimport_Foundzipimages4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Found {count} images in ZIP file`)
};

const es_admintools_bulkimport_foundzipimages4 = /** @type {(inputs: Admintools_Bulkimport_Foundzipimages4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se encontraron {count} imágenes en el archivo ZIP`)
};

const fr_admintools_bulkimport_foundzipimages4 = /** @type {(inputs: Admintools_Bulkimport_Foundzipimages4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} images trouvées dans le fichier ZIP`)
};

const ar_admintools_bulkimport_foundzipimages4 = /** @type {(inputs: Admintools_Bulkimport_Foundzipimages4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Found {count} images in ZIP file`)
};

/**
* | output |
* | --- |
* | "Found {count} images in ZIP file" |
*
* @param {Admintools_Bulkimport_Foundzipimages4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_foundzipimages4 = /** @type {((inputs?: Admintools_Bulkimport_Foundzipimages4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Foundzipimages4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_foundzipimages4(inputs)
	if (locale === "es") return es_admintools_bulkimport_foundzipimages4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_foundzipimages4(inputs)
	return ar_admintools_bulkimport_foundzipimages4(inputs)
});
export { admintools_bulkimport_foundzipimages4 as "adminTools.bulkImport.foundZipImages" }