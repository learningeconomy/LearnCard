/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Aimissiongen5Inputs */

const en_boostcms_aimissiongen5 = /** @type {(inputs: Boostcms_Aimissiongen5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Mission Generation`)
};

const es_boostcms_aimissiongen5 = /** @type {(inputs: Boostcms_Aimissiongen5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generación de Misiones con IA`)
};

const fr_boostcms_aimissiongen5 = /** @type {(inputs: Boostcms_Aimissiongen5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération de mission IA`)
};

const ar_boostcms_aimissiongen5 = /** @type {(inputs: Boostcms_Aimissiongen5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توليد المهام بالذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Mission Generation" |
*
* @param {Boostcms_Aimissiongen5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_aimissiongen5 = /** @type {((inputs?: Boostcms_Aimissiongen5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Aimissiongen5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_aimissiongen5(inputs)
	if (locale === "es") return es_boostcms_aimissiongen5(inputs)
	if (locale === "fr") return fr_boostcms_aimissiongen5(inputs)
	return ar_boostcms_aimissiongen5(inputs)
});
export { boostcms_aimissiongen5 as "boostCMS.aiMissionGen" }