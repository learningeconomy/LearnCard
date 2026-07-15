/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Createdfw2Inputs */

const en_skillframeworks_createdfw2 = /** @type {(inputs: Skillframeworks_Createdfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created {date}`)
};

const es_skillframeworks_createdfw2 = /** @type {(inputs: Skillframeworks_Createdfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creado {date}`)
};

const fr_skillframeworks_createdfw2 = /** @type {(inputs: Skillframeworks_Createdfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créé le {date}`)
};

const ar_skillframeworks_createdfw2 = /** @type {(inputs: Skillframeworks_Createdfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الإنشاء {date}`)
};

/**
* | output |
* | --- |
* | "Created {date}" |
*
* @param {Skillframeworks_Createdfw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_createdfw2 = /** @type {((inputs?: Skillframeworks_Createdfw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Createdfw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_createdfw2(inputs)
	if (locale === "es") return es_skillframeworks_createdfw2(inputs)
	if (locale === "fr") return fr_skillframeworks_createdfw2(inputs)
	return ar_skillframeworks_createdfw2(inputs)
});
export { skillframeworks_createdfw2 as "skillFrameworks.createdFw" }