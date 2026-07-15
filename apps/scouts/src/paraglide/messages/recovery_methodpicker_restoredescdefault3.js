/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Methodpicker_Restoredescdefault3Inputs */

const en_recovery_methodpicker_restoredescdefault3 = /** @type {(inputs: Recovery_Methodpicker_Restoredescdefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose how you'd like to restore access.`)
};

const es_recovery_methodpicker_restoredescdefault3 = /** @type {(inputs: Recovery_Methodpicker_Restoredescdefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige cómo te gustaría restaurar el acceso.`)
};

const fr_recovery_methodpicker_restoredescdefault3 = /** @type {(inputs: Recovery_Methodpicker_Restoredescdefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez comment vous souhaitez restaurer l'accès.`)
};

const ar_recovery_methodpicker_restoredescdefault3 = /** @type {(inputs: Recovery_Methodpicker_Restoredescdefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose how you'd like to restore access.`)
};

/**
* | output |
* | --- |
* | "Choose how you'd like to restore access." |
*
* @param {Recovery_Methodpicker_Restoredescdefault3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_methodpicker_restoredescdefault3 = /** @type {((inputs?: Recovery_Methodpicker_Restoredescdefault3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Methodpicker_Restoredescdefault3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_methodpicker_restoredescdefault3(inputs)
	if (locale === "es") return es_recovery_methodpicker_restoredescdefault3(inputs)
	if (locale === "fr") return fr_recovery_methodpicker_restoredescdefault3(inputs)
	return ar_recovery_methodpicker_restoredescdefault3(inputs)
});
export { recovery_methodpicker_restoredescdefault3 as "recovery.methodPicker.restoreDescDefault" }