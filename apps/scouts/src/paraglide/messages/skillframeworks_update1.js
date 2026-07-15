/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Update1Inputs */

const en_skillframeworks_update1 = /** @type {(inputs: Skillframeworks_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update`)
};

const es_skillframeworks_update1 = /** @type {(inputs: Skillframeworks_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar`)
};

const fr_skillframeworks_update1 = /** @type {(inputs: Skillframeworks_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre à jour`)
};

const ar_skillframeworks_update1 = /** @type {(inputs: Skillframeworks_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update`)
};

/**
* | output |
* | --- |
* | "Update" |
*
* @param {Skillframeworks_Update1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_update1 = /** @type {((inputs?: Skillframeworks_Update1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Update1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_update1(inputs)
	if (locale === "es") return es_skillframeworks_update1(inputs)
	if (locale === "fr") return fr_skillframeworks_update1(inputs)
	return ar_skillframeworks_update1(inputs)
});
export { skillframeworks_update1 as "skillFrameworks.update" }