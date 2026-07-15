/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Selectskills4Inputs */

const en_boostcms_selectskills4 = /** @type {(inputs: Boostcms_Selectskills4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Skills`)
};

const es_boostcms_selectskills4 = /** @type {(inputs: Boostcms_Selectskills4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Habilidades`)
};

const fr_boostcms_selectskills4 = /** @type {(inputs: Boostcms_Selectskills4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner des compétences`)
};

const ar_boostcms_selectskills4 = /** @type {(inputs: Boostcms_Selectskills4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Skills`)
};

/**
* | output |
* | --- |
* | "Select Skills" |
*
* @param {Boostcms_Selectskills4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_selectskills4 = /** @type {((inputs?: Boostcms_Selectskills4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Selectskills4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_selectskills4(inputs)
	if (locale === "es") return es_boostcms_selectskills4(inputs)
	if (locale === "fr") return fr_boostcms_selectskills4(inputs)
	return ar_boostcms_selectskills4(inputs)
});
export { boostcms_selectskills4 as "boostCMS.selectSkills" }