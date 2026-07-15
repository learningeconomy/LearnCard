/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Skillscount2Inputs */

const en_skillframeworks_skillscount2 = /** @type {(inputs: Skillframeworks_Skillscount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Skills`)
};

const es_skillframeworks_skillscount2 = /** @type {(inputs: Skillframeworks_Skillscount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Habilidades`)
};

const fr_skillframeworks_skillscount2 = /** @type {(inputs: Skillframeworks_Skillscount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} compétences`)
};

const ar_skillframeworks_skillscount2 = /** @type {(inputs: Skillframeworks_Skillscount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} مهارات`)
};

/**
* | output |
* | --- |
* | "{count} Skills" |
*
* @param {Skillframeworks_Skillscount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_skillscount2 = /** @type {((inputs?: Skillframeworks_Skillscount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Skillscount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_skillscount2(inputs)
	if (locale === "es") return es_skillframeworks_skillscount2(inputs)
	if (locale === "fr") return fr_skillframeworks_skillscount2(inputs)
	return ar_skillframeworks_skillscount2(inputs)
});
export { skillframeworks_skillscount2 as "skillFrameworks.skillsCount" }