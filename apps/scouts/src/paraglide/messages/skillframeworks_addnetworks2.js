/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Addnetworks2Inputs */

const en_skillframeworks_addnetworks2 = /** @type {(inputs: Skillframeworks_Addnetworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Networks`)
};

const es_skillframeworks_addnetworks2 = /** @type {(inputs: Skillframeworks_Addnetworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Redes`)
};

const fr_skillframeworks_addnetworks2 = /** @type {(inputs: Skillframeworks_Addnetworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter des réseaux`)
};

const ar_skillframeworks_addnetworks2 = /** @type {(inputs: Skillframeworks_Addnetworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة شبكات`)
};

/**
* | output |
* | --- |
* | "Add Networks" |
*
* @param {Skillframeworks_Addnetworks2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_addnetworks2 = /** @type {((inputs?: Skillframeworks_Addnetworks2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Addnetworks2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_addnetworks2(inputs)
	if (locale === "es") return es_skillframeworks_addnetworks2(inputs)
	if (locale === "fr") return fr_skillframeworks_addnetworks2(inputs)
	return ar_skillframeworks_addnetworks2(inputs)
});
export { skillframeworks_addnetworks2 as "skillFrameworks.addNetworks" }