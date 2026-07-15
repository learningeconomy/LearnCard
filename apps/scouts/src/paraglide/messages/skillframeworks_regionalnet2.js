/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Regionalnet2Inputs */

const en_skillframeworks_regionalnet2 = /** @type {(inputs: Skillframeworks_Regionalnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Regional Network`)
};

const es_skillframeworks_regionalnet2 = /** @type {(inputs: Skillframeworks_Regionalnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red Regional`)
};

const fr_skillframeworks_regionalnet2 = /** @type {(inputs: Skillframeworks_Regionalnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau régional`)
};

const ar_skillframeworks_regionalnet2 = /** @type {(inputs: Skillframeworks_Regionalnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Regional Network`)
};

/**
* | output |
* | --- |
* | "Regional Network" |
*
* @param {Skillframeworks_Regionalnet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_regionalnet2 = /** @type {((inputs?: Skillframeworks_Regionalnet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Regionalnet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_regionalnet2(inputs)
	if (locale === "es") return es_skillframeworks_regionalnet2(inputs)
	if (locale === "fr") return fr_skillframeworks_regionalnet2(inputs)
	return ar_skillframeworks_regionalnet2(inputs)
});
export { skillframeworks_regionalnet2 as "skillFrameworks.regionalNet" }