/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Deletecredentialerror2Inputs */

const en_toasts_boost_deletecredentialerror2 = /** @type {(inputs: Toasts_Boost_Deletecredentialerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error deleting credential: unable to locate record ID.`)
};

const es_toasts_boost_deletecredentialerror2 = /** @type {(inputs: Toasts_Boost_Deletecredentialerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al eliminar credencial: no se pudo ubicar el ID del registro.`)
};

const de_toasts_boost_deletecredentialerror2 = /** @type {(inputs: Toasts_Boost_Deletecredentialerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fehler beim Löschen der Berechtigung: Datensatz-ID nicht gefunden.`)
};

const ar_toasts_boost_deletecredentialerror2 = /** @type {(inputs: Toasts_Boost_Deletecredentialerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في حذف بيانات الاعتماد: تعذر تحديد موقع معرف السجل.`)
};

const fr_toasts_boost_deletecredentialerror2 = /** @type {(inputs: Toasts_Boost_Deletecredentialerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de la suppression de l'accréditation : impossible de localiser l'ID d'enregistrement.`)
};

const ko_toasts_boost_deletecredentialerror2 = /** @type {(inputs: Toasts_Boost_Deletecredentialerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명 삭제 오류: 레코드 ID를 찾을 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "Error deleting credential: unable to locate record ID." |
*
* @param {Toasts_Boost_Deletecredentialerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_boost_deletecredentialerror2 = /** @type {((inputs?: Toasts_Boost_Deletecredentialerror2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Deletecredentialerror2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_deletecredentialerror2(inputs)
	if (locale === "es") return es_toasts_boost_deletecredentialerror2(inputs)
	if (locale === "de") return de_toasts_boost_deletecredentialerror2(inputs)
	if (locale === "ar") return ar_toasts_boost_deletecredentialerror2(inputs)
	if (locale === "fr") return fr_toasts_boost_deletecredentialerror2(inputs)
	return ko_toasts_boost_deletecredentialerror2(inputs)
});
export { toasts_boost_deletecredentialerror2 as "toasts.boost.deleteCredentialError" }