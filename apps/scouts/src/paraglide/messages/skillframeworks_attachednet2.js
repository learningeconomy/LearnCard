/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Attachednet2Inputs */

const en_skillframeworks_attachednet2 = /** @type {(inputs: Skillframeworks_Attachednet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attached Network`)
};

const es_skillframeworks_attachednet2 = /** @type {(inputs: Skillframeworks_Attachednet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red Adjunta`)
};

const fr_skillframeworks_attachednet2 = /** @type {(inputs: Skillframeworks_Attachednet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau attaché`)
};

const ar_skillframeworks_attachednet2 = /** @type {(inputs: Skillframeworks_Attachednet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة المرفقة`)
};

/**
* | output |
* | --- |
* | "Attached Network" |
*
* @param {Skillframeworks_Attachednet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_attachednet2 = /** @type {((inputs?: Skillframeworks_Attachednet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Attachednet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_attachednet2(inputs)
	if (locale === "es") return es_skillframeworks_attachednet2(inputs)
	if (locale === "fr") return fr_skillframeworks_attachednet2(inputs)
	return ar_skillframeworks_attachednet2(inputs)
});
export { skillframeworks_attachednet2 as "skillFrameworks.attachedNet" }