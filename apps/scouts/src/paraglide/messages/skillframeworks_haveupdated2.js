/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Haveupdated2Inputs */

const en_skillframeworks_haveupdated2 = /** @type {(inputs: Skillframeworks_Haveupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`have been updated`)
};

const es_skillframeworks_haveupdated2 = /** @type {(inputs: Skillframeworks_Haveupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`se han actualizado`)
};

const fr_skillframeworks_haveupdated2 = /** @type {(inputs: Skillframeworks_Haveupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ont été mis à jour`)
};

const ar_skillframeworks_haveupdated2 = /** @type {(inputs: Skillframeworks_Haveupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم التحديث`)
};

/**
* | output |
* | --- |
* | "have been updated" |
*
* @param {Skillframeworks_Haveupdated2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_haveupdated2 = /** @type {((inputs?: Skillframeworks_Haveupdated2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Haveupdated2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_haveupdated2(inputs)
	if (locale === "es") return es_skillframeworks_haveupdated2(inputs)
	if (locale === "fr") return fr_skillframeworks_haveupdated2(inputs)
	return ar_skillframeworks_haveupdated2(inputs)
});
export { skillframeworks_haveupdated2 as "skillFrameworks.haveUpdated" }