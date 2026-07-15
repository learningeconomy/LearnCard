/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwcountone3Inputs */

const en_skillframeworks_fwcountone3 = /** @type {(inputs: Skillframeworks_Fwcountone3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Skill Framework`)
};

const es_skillframeworks_fwcountone3 = /** @type {(inputs: Skillframeworks_Fwcountone3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Marco de Habilidades`)
};

const fr_skillframeworks_fwcountone3 = /** @type {(inputs: Skillframeworks_Fwcountone3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} cadre de compétences`)
};

const ar_skillframeworks_fwcountone3 = /** @type {(inputs: Skillframeworks_Fwcountone3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} إطار مهارات`)
};

/**
* | output |
* | --- |
* | "{count} Skill Framework" |
*
* @param {Skillframeworks_Fwcountone3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwcountone3 = /** @type {((inputs?: Skillframeworks_Fwcountone3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwcountone3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwcountone3(inputs)
	if (locale === "es") return es_skillframeworks_fwcountone3(inputs)
	if (locale === "fr") return fr_skillframeworks_fwcountone3(inputs)
	return ar_skillframeworks_fwcountone3(inputs)
});
export { skillframeworks_fwcountone3 as "skillFrameworks.fwCountOne" }