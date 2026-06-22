/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Storage_Description1Inputs */

const en_admintools_tools_storage_description1 = /** @type {(inputs: Admintools_Tools_Storage_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure your data storage settings.`)
};

const es_admintools_tools_storage_description1 = /** @type {(inputs: Admintools_Tools_Storage_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura los ajustes de almacenamiento de datos.`)
};

const fr_admintools_tools_storage_description1 = /** @type {(inputs: Admintools_Tools_Storage_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez vos paramètres de stockage de données.`)
};

const ar_admintools_tools_storage_description1 = /** @type {(inputs: Admintools_Tools_Storage_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ضبط إعدادات تخزين البيانات.`)
};

/**
* | output |
* | --- |
* | "Configure your data storage settings." |
*
* @param {Admintools_Tools_Storage_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_storage_description1 = /** @type {((inputs?: Admintools_Tools_Storage_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Storage_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_storage_description1(inputs)
	if (locale === "es") return es_admintools_tools_storage_description1(inputs)
	if (locale === "fr") return fr_admintools_tools_storage_description1(inputs)
	return ar_admintools_tools_storage_description1(inputs)
});
export { admintools_tools_storage_description1 as "adminTools.tools.storage.description" }