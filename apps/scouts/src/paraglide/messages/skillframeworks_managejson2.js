/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Managejson2Inputs */

const en_skillframeworks_managejson2 = /** @type {(inputs: Skillframeworks_Managejson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage JSON`)
};

const es_skillframeworks_managejson2 = /** @type {(inputs: Skillframeworks_Managejson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar JSON`)
};

const fr_skillframeworks_managejson2 = /** @type {(inputs: Skillframeworks_Managejson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer le JSON`)
};

const ar_skillframeworks_managejson2 = /** @type {(inputs: Skillframeworks_Managejson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage JSON`)
};

/**
* | output |
* | --- |
* | "Manage JSON" |
*
* @param {Skillframeworks_Managejson2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_managejson2 = /** @type {((inputs?: Skillframeworks_Managejson2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Managejson2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_managejson2(inputs)
	if (locale === "es") return es_skillframeworks_managejson2(inputs)
	if (locale === "fr") return fr_skillframeworks_managejson2(inputs)
	return ar_skillframeworks_managejson2(inputs)
});
export { skillframeworks_managejson2 as "skillFrameworks.manageJson" }