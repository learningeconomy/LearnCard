/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Yesstartover3Inputs */

const en_skillframeworks_yesstartover3 = /** @type {(inputs: Skillframeworks_Yesstartover3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Start Over`)
};

const es_skillframeworks_yesstartover3 = /** @type {(inputs: Skillframeworks_Yesstartover3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí, Empezar de Nuevo`)
};

const fr_skillframeworks_yesstartover3 = /** @type {(inputs: Skillframeworks_Yesstartover3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui, recommencer`)
};

const ar_skillframeworks_yesstartover3 = /** @type {(inputs: Skillframeworks_Yesstartover3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Start Over`)
};

/**
* | output |
* | --- |
* | "Yes, Start Over" |
*
* @param {Skillframeworks_Yesstartover3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_yesstartover3 = /** @type {((inputs?: Skillframeworks_Yesstartover3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Yesstartover3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_yesstartover3(inputs)
	if (locale === "es") return es_skillframeworks_yesstartover3(inputs)
	if (locale === "fr") return fr_skillframeworks_yesstartover3(inputs)
	return ar_skillframeworks_yesstartover3(inputs)
});
export { skillframeworks_yesstartover3 as "skillFrameworks.yesStartOver" }