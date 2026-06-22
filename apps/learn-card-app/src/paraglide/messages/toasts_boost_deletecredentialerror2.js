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

const fr_toasts_boost_deletecredentialerror2 = /** @type {(inputs: Toasts_Boost_Deletecredentialerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de la suppression de l'accréditation : impossible de localiser l'ID d'enregistrement.`)
};

const ar_toasts_boost_deletecredentialerror2 = /** @type {(inputs: Toasts_Boost_Deletecredentialerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في حذف بيانات الاعتماد: تعذر تحديد موقع معرف السجل.`)
};

/**
* | output |
* | --- |
* | "Error deleting credential: unable to locate record ID." |
*
* @param {Toasts_Boost_Deletecredentialerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_boost_deletecredentialerror2 = /** @type {((inputs?: Toasts_Boost_Deletecredentialerror2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Deletecredentialerror2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_deletecredentialerror2(inputs)
	if (locale === "es") return es_toasts_boost_deletecredentialerror2(inputs)
	if (locale === "fr") return fr_toasts_boost_deletecredentialerror2(inputs)
	return ar_toasts_boost_deletecredentialerror2(inputs)
});
export { toasts_boost_deletecredentialerror2 as "toasts.boost.deleteCredentialError" }