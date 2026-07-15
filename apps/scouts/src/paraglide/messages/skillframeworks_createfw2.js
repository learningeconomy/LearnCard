/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Createfw2Inputs */

const en_skillframeworks_createfw2 = /** @type {(inputs: Skillframeworks_Createfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Framework`)
};

const es_skillframeworks_createfw2 = /** @type {(inputs: Skillframeworks_Createfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Marco`)
};

const fr_skillframeworks_createfw2 = /** @type {(inputs: Skillframeworks_Createfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un cadre`)
};

const ar_skillframeworks_createfw2 = /** @type {(inputs: Skillframeworks_Createfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء إطار`)
};

/**
* | output |
* | --- |
* | "Create Framework" |
*
* @param {Skillframeworks_Createfw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_createfw2 = /** @type {((inputs?: Skillframeworks_Createfw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Createfw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_createfw2(inputs)
	if (locale === "es") return es_skillframeworks_createfw2(inputs)
	if (locale === "fr") return fr_skillframeworks_createfw2(inputs)
	return ar_skillframeworks_createfw2(inputs)
});
export { skillframeworks_createfw2 as "skillFrameworks.createFw" }