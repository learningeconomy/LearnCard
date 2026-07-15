/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Continueedit4Inputs */

const en_boostcms_continueedit4 = /** @type {(inputs: Boostcms_Continueedit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Editing`)
};

const es_boostcms_continueedit4 = /** @type {(inputs: Boostcms_Continueedit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seguir Editando`)
};

const fr_boostcms_continueedit4 = /** @type {(inputs: Boostcms_Continueedit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer la modification`)
};

const ar_boostcms_continueedit4 = /** @type {(inputs: Boostcms_Continueedit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Editing`)
};

/**
* | output |
* | --- |
* | "Continue Editing" |
*
* @param {Boostcms_Continueedit4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_continueedit4 = /** @type {((inputs?: Boostcms_Continueedit4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Continueedit4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_continueedit4(inputs)
	if (locale === "es") return es_boostcms_continueedit4(inputs)
	if (locale === "fr") return fr_boostcms_continueedit4(inputs)
	return ar_boostcms_continueedit4(inputs)
});
export { boostcms_continueedit4 as "boostCMS.continueEdit" }