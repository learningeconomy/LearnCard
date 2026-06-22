/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Howtofindkey3Inputs */

const en_recovery_howtofindkey3 = /** @type {(inputs: Recovery_Howtofindkey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How to find your recovery key`)
};

const es_recovery_howtofindkey3 = /** @type {(inputs: Recovery_Howtofindkey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo encontrar tu clave de recuperación`)
};

const fr_recovery_howtofindkey3 = /** @type {(inputs: Recovery_Howtofindkey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment trouver votre clé de récupération`)
};

const ar_recovery_howtofindkey3 = /** @type {(inputs: Recovery_Howtofindkey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيفية العثور على مفتاح الاسترداد`)
};

/**
* | output |
* | --- |
* | "How to find your recovery key" |
*
* @param {Recovery_Howtofindkey3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_howtofindkey3 = /** @type {((inputs?: Recovery_Howtofindkey3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Howtofindkey3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_howtofindkey3(inputs)
	if (locale === "es") return es_recovery_howtofindkey3(inputs)
	if (locale === "fr") return fr_recovery_howtofindkey3(inputs)
	return ar_recovery_howtofindkey3(inputs)
});
export { recovery_howtofindkey3 as "recovery.howToFindKey" }