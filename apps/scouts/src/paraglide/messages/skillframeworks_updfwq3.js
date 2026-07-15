/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Updfwq3Inputs */

const en_skillframeworks_updfwq3 = /** @type {(inputs: Skillframeworks_Updfwq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update Framework?`)
};

const es_skillframeworks_updfwq3 = /** @type {(inputs: Skillframeworks_Updfwq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Actualizar Marco?`)
};

const fr_skillframeworks_updfwq3 = /** @type {(inputs: Skillframeworks_Updfwq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre à jour le cadre ?`)
};

const ar_skillframeworks_updfwq3 = /** @type {(inputs: Skillframeworks_Updfwq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update Framework?`)
};

/**
* | output |
* | --- |
* | "Update Framework?" |
*
* @param {Skillframeworks_Updfwq3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_updfwq3 = /** @type {((inputs?: Skillframeworks_Updfwq3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Updfwq3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_updfwq3(inputs)
	if (locale === "es") return es_skillframeworks_updfwq3(inputs)
	if (locale === "fr") return fr_skillframeworks_updfwq3(inputs)
	return ar_skillframeworks_updfwq3(inputs)
});
export { skillframeworks_updfwq3 as "skillFrameworks.updFwQ" }