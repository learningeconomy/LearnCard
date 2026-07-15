/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Attachtitle2Inputs */

const en_skillframeworks_attachtitle2 = /** @type {(inputs: Skillframeworks_Attachtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attach "{name}" to Network`)
};

const es_skillframeworks_attachtitle2 = /** @type {(inputs: Skillframeworks_Attachtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adjuntar "{name}" a la Red`)
};

const fr_skillframeworks_attachtitle2 = /** @type {(inputs: Skillframeworks_Attachtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attacher « {name} » au réseau`)
};

const ar_skillframeworks_attachtitle2 = /** @type {(inputs: Skillframeworks_Attachtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attach "{name}" to Network`)
};

/**
* | output |
* | --- |
* | "Attach \"{name}\" to Network" |
*
* @param {Skillframeworks_Attachtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_attachtitle2 = /** @type {((inputs?: Skillframeworks_Attachtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Attachtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_attachtitle2(inputs)
	if (locale === "es") return es_skillframeworks_attachtitle2(inputs)
	if (locale === "fr") return fr_skillframeworks_attachtitle2(inputs)
	return ar_skillframeworks_attachtitle2(inputs)
});
export { skillframeworks_attachtitle2 as "skillFrameworks.attachTitle" }