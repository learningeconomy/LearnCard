/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Methodpicker_Restoredescmissing3Inputs */

const en_recovery_methodpicker_restoredescmissing3 = /** @type {(inputs: Recovery_Methodpicker_Restoredescmissing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose how you'd like to restore access to your account.`)
};

const es_recovery_methodpicker_restoredescmissing3 = /** @type {(inputs: Recovery_Methodpicker_Restoredescmissing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige cómo te gustaría restaurar el acceso a tu cuenta.`)
};

const fr_recovery_methodpicker_restoredescmissing3 = /** @type {(inputs: Recovery_Methodpicker_Restoredescmissing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez comment vous souhaitez restaurer l'accès à votre compte.`)
};

const ar_recovery_methodpicker_restoredescmissing3 = /** @type {(inputs: Recovery_Methodpicker_Restoredescmissing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose how you'd like to restore access to your account.`)
};

/**
* | output |
* | --- |
* | "Choose how you'd like to restore access to your account." |
*
* @param {Recovery_Methodpicker_Restoredescmissing3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_methodpicker_restoredescmissing3 = /** @type {((inputs?: Recovery_Methodpicker_Restoredescmissing3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Methodpicker_Restoredescmissing3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_methodpicker_restoredescmissing3(inputs)
	if (locale === "es") return es_recovery_methodpicker_restoredescmissing3(inputs)
	if (locale === "fr") return fr_recovery_methodpicker_restoredescmissing3(inputs)
	return ar_recovery_methodpicker_restoredescmissing3(inputs)
});
export { recovery_methodpicker_restoredescmissing3 as "recovery.methodPicker.restoreDescMissing" }