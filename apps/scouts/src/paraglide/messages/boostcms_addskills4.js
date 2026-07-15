/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Addskills4Inputs */

const en_boostcms_addskills4 = /** @type {(inputs: Boostcms_Addskills4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Skills`)
};

const es_boostcms_addskills4 = /** @type {(inputs: Boostcms_Addskills4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Habilidades`)
};

const fr_boostcms_addskills4 = /** @type {(inputs: Boostcms_Addskills4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter des compétences`)
};

const ar_boostcms_addskills4 = /** @type {(inputs: Boostcms_Addskills4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Skills`)
};

/**
* | output |
* | --- |
* | "Add Skills" |
*
* @param {Boostcms_Addskills4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_addskills4 = /** @type {((inputs?: Boostcms_Addskills4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Addskills4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_addskills4(inputs)
	if (locale === "es") return es_boostcms_addskills4(inputs)
	if (locale === "fr") return fr_boostcms_addskills4(inputs)
	return ar_boostcms_addskills4(inputs)
});
export { boostcms_addskills4 as "boostCMS.addSkills" }