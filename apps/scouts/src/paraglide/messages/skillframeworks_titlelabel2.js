/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Titlelabel2Inputs */

const en_skillframeworks_titlelabel2 = /** @type {(inputs: Skillframeworks_Titlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Title*`)
};

const es_skillframeworks_titlelabel2 = /** @type {(inputs: Skillframeworks_Titlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título*`)
};

const fr_skillframeworks_titlelabel2 = /** @type {(inputs: Skillframeworks_Titlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre*`)
};

const ar_skillframeworks_titlelabel2 = /** @type {(inputs: Skillframeworks_Titlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Title*`)
};

/**
* | output |
* | --- |
* | "Title*" |
*
* @param {Skillframeworks_Titlelabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_titlelabel2 = /** @type {((inputs?: Skillframeworks_Titlelabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Titlelabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_titlelabel2(inputs)
	if (locale === "es") return es_skillframeworks_titlelabel2(inputs)
	if (locale === "fr") return fr_skillframeworks_titlelabel2(inputs)
	return ar_skillframeworks_titlelabel2(inputs)
});
export { skillframeworks_titlelabel2 as "skillFrameworks.titleLabel" }