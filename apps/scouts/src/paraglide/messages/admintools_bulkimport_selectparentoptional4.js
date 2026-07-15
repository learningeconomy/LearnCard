/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Selectparentoptional4Inputs */

const en_admintools_bulkimport_selectparentoptional4 = /** @type {(inputs: Admintools_Bulkimport_Selectparentoptional4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5. (Optional) Select the parent boost that these boosts will be created under`)
};

const es_admintools_bulkimport_selectparentoptional4 = /** @type {(inputs: Admintools_Bulkimport_Selectparentoptional4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5. (Opcional) Selecciona el boost padre bajo el cual se crearán estos boosts`)
};

const fr_admintools_bulkimport_selectparentoptional4 = /** @type {(inputs: Admintools_Bulkimport_Selectparentoptional4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5. (Facultatif) Sélectionnez le Boost parent sous lequel ces Boosts seront créés`)
};

const ar_admintools_bulkimport_selectparentoptional4 = /** @type {(inputs: Admintools_Bulkimport_Selectparentoptional4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5. (اختياري) اختر التعزيز الأصلي الذي سيتم إنشاء هذه التعزيزات تحته`)
};

/**
* | output |
* | --- |
* | "5. (Optional) Select the parent boost that these boosts will be created under" |
*
* @param {Admintools_Bulkimport_Selectparentoptional4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_selectparentoptional4 = /** @type {((inputs?: Admintools_Bulkimport_Selectparentoptional4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Selectparentoptional4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_selectparentoptional4(inputs)
	if (locale === "es") return es_admintools_bulkimport_selectparentoptional4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_selectparentoptional4(inputs)
	return ar_admintools_bulkimport_selectparentoptional4(inputs)
});
export { admintools_bulkimport_selectparentoptional4 as "adminTools.bulkImport.selectParentOptional" }