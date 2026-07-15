/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Viewid_Editbtn2Inputs */

const en_troops_viewid_editbtn2 = /** @type {(inputs: Troops_Viewid_Editbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

const es_troops_viewid_editbtn2 = /** @type {(inputs: Troops_Viewid_Editbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar`)
};

const fr_troops_viewid_editbtn2 = /** @type {(inputs: Troops_Viewid_Editbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_troops_viewid_editbtn2 = /** @type {(inputs: Troops_Viewid_Editbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Troops_Viewid_Editbtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_viewid_editbtn2 = /** @type {((inputs?: Troops_Viewid_Editbtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Viewid_Editbtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_viewid_editbtn2(inputs)
	if (locale === "es") return es_troops_viewid_editbtn2(inputs)
	if (locale === "fr") return fr_troops_viewid_editbtn2(inputs)
	return ar_troops_viewid_editbtn2(inputs)
});
export { troops_viewid_editbtn2 as "troops.viewId.editBtn" }