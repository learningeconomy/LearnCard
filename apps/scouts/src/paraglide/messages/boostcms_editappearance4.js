/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Editappearance4Inputs */

const en_boostcms_editappearance4 = /** @type {(inputs: Boostcms_Editappearance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Appearance`)
};

const es_boostcms_editappearance4 = /** @type {(inputs: Boostcms_Editappearance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Apariencia`)
};

const fr_boostcms_editappearance4 = /** @type {(inputs: Boostcms_Editappearance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier l'apparence`)
};

const ar_boostcms_editappearance4 = /** @type {(inputs: Boostcms_Editappearance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل المظهر`)
};

/**
* | output |
* | --- |
* | "Edit Appearance" |
*
* @param {Boostcms_Editappearance4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_editappearance4 = /** @type {((inputs?: Boostcms_Editappearance4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Editappearance4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_editappearance4(inputs)
	if (locale === "es") return es_boostcms_editappearance4(inputs)
	if (locale === "fr") return fr_boostcms_editappearance4(inputs)
	return ar_boostcms_editappearance4(inputs)
});
export { boostcms_editappearance4 as "boostCMS.editAppearance" }