/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Createids5Inputs */

const en_boostcms_createids5 = /** @type {(inputs: Boostcms_Createids5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create IDs`)
};

const es_boostcms_createids5 = /** @type {(inputs: Boostcms_Createids5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear IDs`)
};

const fr_boostcms_createids5 = /** @type {(inputs: Boostcms_Createids5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer des identifiants`)
};

const ar_boostcms_createids5 = /** @type {(inputs: Boostcms_Createids5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء معرفات`)
};

/**
* | output |
* | --- |
* | "Create IDs" |
*
* @param {Boostcms_Createids5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_createids5 = /** @type {((inputs?: Boostcms_Createids5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Createids5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_createids5(inputs)
	if (locale === "es") return es_boostcms_createids5(inputs)
	if (locale === "fr") return fr_boostcms_createids5(inputs)
	return ar_boostcms_createids5(inputs)
});
export { boostcms_createids5 as "boostCMS.createIDs" }