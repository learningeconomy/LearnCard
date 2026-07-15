/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Skills3Inputs */

const en_boostcms_skills3 = /** @type {(inputs: Boostcms_Skills3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills`)
};

const es_boostcms_skills3 = /** @type {(inputs: Boostcms_Skills3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades`)
};

const fr_boostcms_skills3 = /** @type {(inputs: Boostcms_Skills3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences`)
};

const ar_boostcms_skills3 = /** @type {(inputs: Boostcms_Skills3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات`)
};

/**
* | output |
* | --- |
* | "Skills" |
*
* @param {Boostcms_Skills3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_skills3 = /** @type {((inputs?: Boostcms_Skills3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Skills3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_skills3(inputs)
	if (locale === "es") return es_boostcms_skills3(inputs)
	if (locale === "fr") return fr_boostcms_skills3(inputs)
	return ar_boostcms_skills3(inputs)
});
export { boostcms_skills3 as "boostCMS.skills" }