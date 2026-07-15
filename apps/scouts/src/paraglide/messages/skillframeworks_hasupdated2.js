/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Hasupdated2Inputs */

const en_skillframeworks_hasupdated2 = /** @type {(inputs: Skillframeworks_Hasupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`has been updated`)
};

const es_skillframeworks_hasupdated2 = /** @type {(inputs: Skillframeworks_Hasupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`se ha actualizado`)
};

const fr_skillframeworks_hasupdated2 = /** @type {(inputs: Skillframeworks_Hasupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`a été mis à jour`)
};

const ar_skillframeworks_hasupdated2 = /** @type {(inputs: Skillframeworks_Hasupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم التحديث`)
};

/**
* | output |
* | --- |
* | "has been updated" |
*
* @param {Skillframeworks_Hasupdated2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_hasupdated2 = /** @type {((inputs?: Skillframeworks_Hasupdated2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Hasupdated2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_hasupdated2(inputs)
	if (locale === "es") return es_skillframeworks_hasupdated2(inputs)
	if (locale === "fr") return fr_skillframeworks_hasupdated2(inputs)
	return ar_skillframeworks_hasupdated2(inputs)
});
export { skillframeworks_hasupdated2 as "skillFrameworks.hasUpdated" }