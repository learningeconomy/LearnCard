/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwcountother3Inputs */

const en_skillframeworks_fwcountother3 = /** @type {(inputs: Skillframeworks_Fwcountother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Skill Frameworks`)
};

const es_skillframeworks_fwcountother3 = /** @type {(inputs: Skillframeworks_Fwcountother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Marcos de Habilidades`)
};

const fr_skillframeworks_fwcountother3 = /** @type {(inputs: Skillframeworks_Fwcountother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} cadres de compétences`)
};

const ar_skillframeworks_fwcountother3 = /** @type {(inputs: Skillframeworks_Fwcountother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} أطر مهارات`)
};

/**
* | output |
* | --- |
* | "{count} Skill Frameworks" |
*
* @param {Skillframeworks_Fwcountother3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwcountother3 = /** @type {((inputs?: Skillframeworks_Fwcountother3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwcountother3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwcountother3(inputs)
	if (locale === "es") return es_skillframeworks_fwcountother3(inputs)
	if (locale === "fr") return fr_skillframeworks_fwcountother3(inputs)
	return ar_skillframeworks_fwcountother3(inputs)
});
export { skillframeworks_fwcountother3 as "skillFrameworks.fwCountOther" }