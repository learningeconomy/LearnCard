/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Editfwdesc3Inputs */

const en_skillframeworks_editfwdesc3 = /** @type {(inputs: Skillframeworks_Editfwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update the framework name and description`)
};

const es_skillframeworks_editfwdesc3 = /** @type {(inputs: Skillframeworks_Editfwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualiza el nombre y la descripción del marco`)
};

const fr_skillframeworks_editfwdesc3 = /** @type {(inputs: Skillframeworks_Editfwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre à jour le nom et la description du cadre`)
};

const ar_skillframeworks_editfwdesc3 = /** @type {(inputs: Skillframeworks_Editfwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديث اسم الإطار ووصفه`)
};

/**
* | output |
* | --- |
* | "Update the framework name and description" |
*
* @param {Skillframeworks_Editfwdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_editfwdesc3 = /** @type {((inputs?: Skillframeworks_Editfwdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Editfwdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_editfwdesc3(inputs)
	if (locale === "es") return es_skillframeworks_editfwdesc3(inputs)
	if (locale === "fr") return fr_skillframeworks_editfwdesc3(inputs)
	return ar_skillframeworks_editfwdesc3(inputs)
});
export { skillframeworks_editfwdesc3 as "skillFrameworks.editFwDesc" }