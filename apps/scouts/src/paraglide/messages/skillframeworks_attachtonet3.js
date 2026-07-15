/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Attachtonet3Inputs */

const en_skillframeworks_attachtonet3 = /** @type {(inputs: Skillframeworks_Attachtonet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attach to Network`)
};

const es_skillframeworks_attachtonet3 = /** @type {(inputs: Skillframeworks_Attachtonet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adjuntar a Red`)
};

const fr_skillframeworks_attachtonet3 = /** @type {(inputs: Skillframeworks_Attachtonet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attacher au réseau`)
};

const ar_skillframeworks_attachtonet3 = /** @type {(inputs: Skillframeworks_Attachtonet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attach to Network`)
};

/**
* | output |
* | --- |
* | "Attach to Network" |
*
* @param {Skillframeworks_Attachtonet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_attachtonet3 = /** @type {((inputs?: Skillframeworks_Attachtonet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Attachtonet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_attachtonet3(inputs)
	if (locale === "es") return es_skillframeworks_attachtonet3(inputs)
	if (locale === "fr") return fr_skillframeworks_attachtonet3(inputs)
	return ar_skillframeworks_attachtonet3(inputs)
});
export { skillframeworks_attachtonet3 as "skillFrameworks.attachToNet" }