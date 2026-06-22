/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Couldnotsave2Inputs */

const en_recovery_couldnotsave2 = /** @type {(inputs: Recovery_Couldnotsave2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not save the file. Please try again.`)
};

const es_recovery_couldnotsave2 = /** @type {(inputs: Recovery_Couldnotsave2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo guardar el archivo. Inténtalo de nuevo.`)
};

const fr_recovery_couldnotsave2 = /** @type {(inputs: Recovery_Couldnotsave2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de sauvegarder le fichier. Veuillez réessayer.`)
};

const ar_recovery_couldnotsave2 = /** @type {(inputs: Recovery_Couldnotsave2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر حفظ الملف. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Could not save the file. Please try again." |
*
* @param {Recovery_Couldnotsave2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_couldnotsave2 = /** @type {((inputs?: Recovery_Couldnotsave2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Couldnotsave2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_couldnotsave2(inputs)
	if (locale === "es") return es_recovery_couldnotsave2(inputs)
	if (locale === "fr") return fr_recovery_couldnotsave2(inputs)
	return ar_recovery_couldnotsave2(inputs)
});
export { recovery_couldnotsave2 as "recovery.couldNotSave" }