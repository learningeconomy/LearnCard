/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Mgnets2Inputs */

const en_skillframeworks_mgnets2 = /** @type {(inputs: Skillframeworks_Mgnets2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Networks`)
};

const es_skillframeworks_mgnets2 = /** @type {(inputs: Skillframeworks_Mgnets2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar Redes`)
};

const fr_skillframeworks_mgnets2 = /** @type {(inputs: Skillframeworks_Mgnets2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les réseaux`)
};

const ar_skillframeworks_mgnets2 = /** @type {(inputs: Skillframeworks_Mgnets2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة الشبكات`)
};

/**
* | output |
* | --- |
* | "Manage Networks" |
*
* @param {Skillframeworks_Mgnets2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_mgnets2 = /** @type {((inputs?: Skillframeworks_Mgnets2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Mgnets2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_mgnets2(inputs)
	if (locale === "es") return es_skillframeworks_mgnets2(inputs)
	if (locale === "fr") return fr_skillframeworks_mgnets2(inputs)
	return ar_skillframeworks_mgnets2(inputs)
});
export { skillframeworks_mgnets2 as "skillFrameworks.mgNets" }