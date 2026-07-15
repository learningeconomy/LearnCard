/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Step12Inputs */

const en_admintools_bulkimport_step12 = /** @type {(inputs: Admintools_Bulkimport_Step12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Step 1`)
};

const es_admintools_bulkimport_step12 = /** @type {(inputs: Admintools_Bulkimport_Step12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paso 1`)
};

const fr_admintools_bulkimport_step12 = /** @type {(inputs: Admintools_Bulkimport_Step12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Étape 1`)
};

const ar_admintools_bulkimport_step12 = /** @type {(inputs: Admintools_Bulkimport_Step12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخطوة 1`)
};

/**
* | output |
* | --- |
* | "Step 1" |
*
* @param {Admintools_Bulkimport_Step12Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_step12 = /** @type {((inputs?: Admintools_Bulkimport_Step12Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Step12Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_step12(inputs)
	if (locale === "es") return es_admintools_bulkimport_step12(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_step12(inputs)
	return ar_admintools_bulkimport_step12(inputs)
});
export { admintools_bulkimport_step12 as "adminTools.bulkImport.step1" }