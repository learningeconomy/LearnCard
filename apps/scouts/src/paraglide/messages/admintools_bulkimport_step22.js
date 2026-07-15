/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Step22Inputs */

const en_admintools_bulkimport_step22 = /** @type {(inputs: Admintools_Bulkimport_Step22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Step 2`)
};

const es_admintools_bulkimport_step22 = /** @type {(inputs: Admintools_Bulkimport_Step22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paso 2`)
};

const fr_admintools_bulkimport_step22 = /** @type {(inputs: Admintools_Bulkimport_Step22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Étape 2`)
};

const ar_admintools_bulkimport_step22 = /** @type {(inputs: Admintools_Bulkimport_Step22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخطوة 2`)
};

/**
* | output |
* | --- |
* | "Step 2" |
*
* @param {Admintools_Bulkimport_Step22Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_step22 = /** @type {((inputs?: Admintools_Bulkimport_Step22Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Step22Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_step22(inputs)
	if (locale === "es") return es_admintools_bulkimport_step22(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_step22(inputs)
	return ar_admintools_bulkimport_step22(inputs)
});
export { admintools_bulkimport_step22 as "adminTools.bulkImport.step2" }