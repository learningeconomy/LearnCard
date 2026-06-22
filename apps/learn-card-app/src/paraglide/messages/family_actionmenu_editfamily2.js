/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Actionmenu_Editfamily2Inputs */

const en_family_actionmenu_editfamily2 = /** @type {(inputs: Family_Actionmenu_Editfamily2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Family`)
};

const es_family_actionmenu_editfamily2 = /** @type {(inputs: Family_Actionmenu_Editfamily2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar familia`)
};

const fr_family_actionmenu_editfamily2 = /** @type {(inputs: Family_Actionmenu_Editfamily2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier la famille`)
};

const ar_family_actionmenu_editfamily2 = /** @type {(inputs: Family_Actionmenu_Editfamily2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل العائلة`)
};

/**
* | output |
* | --- |
* | "Edit Family" |
*
* @param {Family_Actionmenu_Editfamily2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_actionmenu_editfamily2 = /** @type {((inputs?: Family_Actionmenu_Editfamily2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Actionmenu_Editfamily2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_actionmenu_editfamily2(inputs)
	if (locale === "es") return es_family_actionmenu_editfamily2(inputs)
	if (locale === "fr") return fr_family_actionmenu_editfamily2(inputs)
	return ar_family_actionmenu_editfamily2(inputs)
});
export { family_actionmenu_editfamily2 as "family.actionMenu.editFamily" }