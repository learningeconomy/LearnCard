/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Methodpicker_Restoretitle2Inputs */

const en_recovery_methodpicker_restoretitle2 = /** @type {(inputs: Recovery_Methodpicker_Restoretitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restore Access`)
};

const es_recovery_methodpicker_restoretitle2 = /** @type {(inputs: Recovery_Methodpicker_Restoretitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurar Acceso`)
};

const fr_recovery_methodpicker_restoretitle2 = /** @type {(inputs: Recovery_Methodpicker_Restoretitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurer l'accès`)
};

const ar_recovery_methodpicker_restoretitle2 = /** @type {(inputs: Recovery_Methodpicker_Restoretitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة الوصول`)
};

/**
* | output |
* | --- |
* | "Restore Access" |
*
* @param {Recovery_Methodpicker_Restoretitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_methodpicker_restoretitle2 = /** @type {((inputs?: Recovery_Methodpicker_Restoretitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Methodpicker_Restoretitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_methodpicker_restoretitle2(inputs)
	if (locale === "es") return es_recovery_methodpicker_restoretitle2(inputs)
	if (locale === "fr") return fr_recovery_methodpicker_restoretitle2(inputs)
	return ar_recovery_methodpicker_restoretitle2(inputs)
});
export { recovery_methodpicker_restoretitle2 as "recovery.methodPicker.restoreTitle" }