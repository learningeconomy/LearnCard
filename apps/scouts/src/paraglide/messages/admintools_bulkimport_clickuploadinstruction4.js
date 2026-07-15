/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Clickuploadinstruction4Inputs */

const en_admintools_bulkimport_clickuploadinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Clickuploadinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`6. Click "Upload!" once all image issues are resolved`)
};

const es_admintools_bulkimport_clickuploadinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Clickuploadinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`6. Haz clic en "Subir" una vez que todos los problemas de imágenes estén resueltos`)
};

const fr_admintools_bulkimport_clickuploadinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Clickuploadinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`6. Cliquez sur « Télécharger ! » une fois que tous les problèmes d'image sont résolus`)
};

const ar_admintools_bulkimport_clickuploadinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Clickuploadinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`6. انقر "رفع!" بعد حل جميع مشكلات الصور`)
};

/**
* | output |
* | --- |
* | "6. Click \"Upload!\" once all image issues are resolved" |
*
* @param {Admintools_Bulkimport_Clickuploadinstruction4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_clickuploadinstruction4 = /** @type {((inputs?: Admintools_Bulkimport_Clickuploadinstruction4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Clickuploadinstruction4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_clickuploadinstruction4(inputs)
	if (locale === "es") return es_admintools_bulkimport_clickuploadinstruction4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_clickuploadinstruction4(inputs)
	return ar_admintools_bulkimport_clickuploadinstruction4(inputs)
});
export { admintools_bulkimport_clickuploadinstruction4 as "adminTools.bulkImport.clickUploadInstruction" }