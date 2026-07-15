/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Addcompsq3Inputs */

const en_skillframeworks_addcompsq3 = /** @type {(inputs: Skillframeworks_Addcompsq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Would you like to add competencies now?`)
};

const es_skillframeworks_addcompsq3 = /** @type {(inputs: Skillframeworks_Addcompsq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Te gustaría añadir competencias ahora?`)
};

const fr_skillframeworks_addcompsq3 = /** @type {(inputs: Skillframeworks_Addcompsq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Souhaitez-vous ajouter des compétences maintenant ?`)
};

const ar_skillframeworks_addcompsq3 = /** @type {(inputs: Skillframeworks_Addcompsq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل ترغب في إضافة كفاءات الآن؟`)
};

/**
* | output |
* | --- |
* | "Would you like to add competencies now?" |
*
* @param {Skillframeworks_Addcompsq3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_addcompsq3 = /** @type {((inputs?: Skillframeworks_Addcompsq3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Addcompsq3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_addcompsq3(inputs)
	if (locale === "es") return es_skillframeworks_addcompsq3(inputs)
	if (locale === "fr") return fr_skillframeworks_addcompsq3(inputs)
	return ar_skillframeworks_addcompsq3(inputs)
});
export { skillframeworks_addcompsq3 as "skillFrameworks.addCompsQ" }