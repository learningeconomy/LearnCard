/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Discchanges2Inputs */

const en_skillframeworks_discchanges2 = /** @type {(inputs: Skillframeworks_Discchanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Do you want to discard your changes?`)
};

const es_skillframeworks_discchanges2 = /** @type {(inputs: Skillframeworks_Discchanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Quieres descartar tus cambios?`)
};

const fr_skillframeworks_discchanges2 = /** @type {(inputs: Skillframeworks_Discchanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous annuler vos modifications ?`)
};

const ar_skillframeworks_discchanges2 = /** @type {(inputs: Skillframeworks_Discchanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Do you want to discard your changes?`)
};

/**
* | output |
* | --- |
* | "Do you want to discard your changes?" |
*
* @param {Skillframeworks_Discchanges2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_discchanges2 = /** @type {((inputs?: Skillframeworks_Discchanges2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Discchanges2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_discchanges2(inputs)
	if (locale === "es") return es_skillframeworks_discchanges2(inputs)
	if (locale === "fr") return fr_skillframeworks_discchanges2(inputs)
	return ar_skillframeworks_discchanges2(inputs)
});
export { skillframeworks_discchanges2 as "skillFrameworks.discChanges" }