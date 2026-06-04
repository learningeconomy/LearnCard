/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Skipfornow2Inputs */

const en_recovery_skipfornow2 = /** @type {(inputs: Recovery_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skip for Now`)
};

const es_recovery_skipfornow2 = /** @type {(inputs: Recovery_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Omitir por ahora`)
};

const de_recovery_skipfornow2 = /** @type {(inputs: Recovery_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vorerst überspringen`)
};

const ar_recovery_skipfornow2 = /** @type {(inputs: Recovery_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطٍّ مؤقت`)
};

const fr_recovery_skipfornow2 = /** @type {(inputs: Recovery_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passer pour le moment`)
};

const ko_recovery_skipfornow2 = /** @type {(inputs: Recovery_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`지금은 건너뛰기`)
};

/**
* | output |
* | --- |
* | "Skip for Now" |
*
* @param {Recovery_Skipfornow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_skipfornow2 = /** @type {((inputs?: Recovery_Skipfornow2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Skipfornow2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_skipfornow2(inputs)
	if (locale === "es") return es_recovery_skipfornow2(inputs)
	if (locale === "de") return de_recovery_skipfornow2(inputs)
	if (locale === "ar") return ar_recovery_skipfornow2(inputs)
	if (locale === "fr") return fr_recovery_skipfornow2(inputs)
	return ko_recovery_skipfornow2(inputs)
});
export { recovery_skipfornow2 as "recovery.skipForNow" }