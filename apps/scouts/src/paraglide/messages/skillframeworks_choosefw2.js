/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Choosefw2Inputs */

const en_skillframeworks_choosefw2 = /** @type {(inputs: Skillframeworks_Choosefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework`)
};

const es_skillframeworks_choosefw2 = /** @type {(inputs: Skillframeworks_Choosefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marco`)
};

const fr_skillframeworks_choosefw2 = /** @type {(inputs: Skillframeworks_Choosefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre`)
};

const ar_skillframeworks_choosefw2 = /** @type {(inputs: Skillframeworks_Choosefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework`)
};

/**
* | output |
* | --- |
* | "Framework" |
*
* @param {Skillframeworks_Choosefw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_choosefw2 = /** @type {((inputs?: Skillframeworks_Choosefw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Choosefw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_choosefw2(inputs)
	if (locale === "es") return es_skillframeworks_choosefw2(inputs)
	if (locale === "fr") return fr_skillframeworks_choosefw2(inputs)
	return ar_skillframeworks_choosefw2(inputs)
});
export { skillframeworks_choosefw2 as "skillFrameworks.chooseFw" }