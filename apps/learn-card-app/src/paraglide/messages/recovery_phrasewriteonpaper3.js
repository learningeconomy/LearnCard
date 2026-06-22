/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrasewriteonpaper3Inputs */

const en_recovery_phrasewriteonpaper3 = /** @type {(inputs: Recovery_Phrasewriteonpaper3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Write it on paper and store it securely`)
};

const es_recovery_phrasewriteonpaper3 = /** @type {(inputs: Recovery_Phrasewriteonpaper3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escríbela en papel y guárdala de forma segura`)
};

const fr_recovery_phrasewriteonpaper3 = /** @type {(inputs: Recovery_Phrasewriteonpaper3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Écrivez-la sur papier et stockez-la en toute sécurité`)
};

const ar_recovery_phrasewriteonpaper3 = /** @type {(inputs: Recovery_Phrasewriteonpaper3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتبها على ورقة واحفظها بشكل آمن`)
};

/**
* | output |
* | --- |
* | "Write it on paper and store it securely" |
*
* @param {Recovery_Phrasewriteonpaper3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrasewriteonpaper3 = /** @type {((inputs?: Recovery_Phrasewriteonpaper3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrasewriteonpaper3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrasewriteonpaper3(inputs)
	if (locale === "es") return es_recovery_phrasewriteonpaper3(inputs)
	if (locale === "fr") return fr_recovery_phrasewriteonpaper3(inputs)
	return ar_recovery_phrasewriteonpaper3(inputs)
});
export { recovery_phrasewriteonpaper3 as "recovery.phraseWriteOnPaper" }