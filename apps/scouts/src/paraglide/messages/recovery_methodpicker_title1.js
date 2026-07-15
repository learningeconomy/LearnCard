/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Methodpicker_Title1Inputs */

const en_recovery_methodpicker_title1 = /** @type {(inputs: Recovery_Methodpicker_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Your Identity`)
};

const es_recovery_methodpicker_title1 = /** @type {(inputs: Recovery_Methodpicker_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica Tu Identidad`)
};

const fr_recovery_methodpicker_title1 = /** @type {(inputs: Recovery_Methodpicker_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez votre identité`)
};

const ar_recovery_methodpicker_title1 = /** @type {(inputs: Recovery_Methodpicker_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق من هويتك`)
};

/**
* | output |
* | --- |
* | "Verify Your Identity" |
*
* @param {Recovery_Methodpicker_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_methodpicker_title1 = /** @type {((inputs?: Recovery_Methodpicker_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Methodpicker_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_methodpicker_title1(inputs)
	if (locale === "es") return es_recovery_methodpicker_title1(inputs)
	if (locale === "fr") return fr_recovery_methodpicker_title1(inputs)
	return ar_recovery_methodpicker_title1(inputs)
});
export { recovery_methodpicker_title1 as "recovery.methodPicker.title" }