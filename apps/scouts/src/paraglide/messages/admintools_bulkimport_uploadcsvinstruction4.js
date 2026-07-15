/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Uploadcsvinstruction4Inputs */

const en_admintools_bulkimport_uploadcsvinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Uploadcsvinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`3. Upload the .csv file using the "Choose File" button below`)
};

const es_admintools_bulkimport_uploadcsvinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Uploadcsvinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`3. Sube el archivo .csv usando el botón "Elegir Archivo"`)
};

const fr_admintools_bulkimport_uploadcsvinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Uploadcsvinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`3. Téléchargez le fichier .csv à l'aide du bouton « Choisir un fichier » ci-dessous`)
};

const ar_admintools_bulkimport_uploadcsvinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Uploadcsvinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`3. رفع ملف .csv باستخدام زر "اختيار ملف" أدناه`)
};

/**
* | output |
* | --- |
* | "3. Upload the .csv file using the \"Choose File\" button below" |
*
* @param {Admintools_Bulkimport_Uploadcsvinstruction4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_uploadcsvinstruction4 = /** @type {((inputs?: Admintools_Bulkimport_Uploadcsvinstruction4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Uploadcsvinstruction4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_uploadcsvinstruction4(inputs)
	if (locale === "es") return es_admintools_bulkimport_uploadcsvinstruction4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_uploadcsvinstruction4(inputs)
	return ar_admintools_bulkimport_uploadcsvinstruction4(inputs)
});
export { admintools_bulkimport_uploadcsvinstruction4 as "adminTools.bulkImport.uploadCsvInstruction" }