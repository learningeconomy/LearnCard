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

const de_recovery_couldnotsave2 = /** @type {(inputs: Recovery_Couldnotsave2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datei konnte nicht gespeichert werden. Bitte versuche es erneut.`)
};

const ar_recovery_couldnotsave2 = /** @type {(inputs: Recovery_Couldnotsave2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر حفظ الملف. يرجى المحاولة مرة أخرى.`)
};

const fr_recovery_couldnotsave2 = /** @type {(inputs: Recovery_Couldnotsave2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de sauvegarder le fichier. Veuillez réessayer.`)
};

const ko_recovery_couldnotsave2 = /** @type {(inputs: Recovery_Couldnotsave2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`파일을 저장할 수 없습니다. 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Could not save the file. Please try again." |
*
* @param {Recovery_Couldnotsave2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_couldnotsave2 = /** @type {((inputs?: Recovery_Couldnotsave2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Couldnotsave2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_couldnotsave2(inputs)
	if (locale === "es") return es_recovery_couldnotsave2(inputs)
	if (locale === "de") return de_recovery_couldnotsave2(inputs)
	if (locale === "ar") return ar_recovery_couldnotsave2(inputs)
	if (locale === "fr") return fr_recovery_couldnotsave2(inputs)
	return ko_recovery_couldnotsave2(inputs)
});
export { recovery_couldnotsave2 as "recovery.couldNotSave" }