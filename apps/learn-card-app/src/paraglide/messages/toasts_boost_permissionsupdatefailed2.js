/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Permissionsupdatefailed2Inputs */

const en_toasts_boost_permissionsupdatefailed2 = /** @type {(inputs: Toasts_Boost_Permissionsupdatefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to update permissions. Please try again.`)
};

const es_toasts_boost_permissionsupdatefailed2 = /** @type {(inputs: Toasts_Boost_Permissionsupdatefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudieron actualizar los permisos. Por favor, intenta de nuevo.`)
};

const de_toasts_boost_permissionsupdatefailed2 = /** @type {(inputs: Toasts_Boost_Permissionsupdatefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigungen konnten nicht aktualisiert werden. Bitte versuche es erneut.`)
};

const ar_toasts_boost_permissionsupdatefailed2 = /** @type {(inputs: Toasts_Boost_Permissionsupdatefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر تحديث الأذونات. يرجى المحاولة مرة أخرى.`)
};

const fr_toasts_boost_permissionsupdatefailed2 = /** @type {(inputs: Toasts_Boost_Permissionsupdatefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de mettre à jour les autorisations. Veuillez réessayer.`)
};

const ko_toasts_boost_permissionsupdatefailed2 = /** @type {(inputs: Toasts_Boost_Permissionsupdatefailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`권한을 업데이트할 수 없습니다. 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Unable to update permissions. Please try again." |
*
* @param {Toasts_Boost_Permissionsupdatefailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_boost_permissionsupdatefailed2 = /** @type {((inputs?: Toasts_Boost_Permissionsupdatefailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Permissionsupdatefailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_permissionsupdatefailed2(inputs)
	if (locale === "es") return es_toasts_boost_permissionsupdatefailed2(inputs)
	if (locale === "de") return de_toasts_boost_permissionsupdatefailed2(inputs)
	if (locale === "ar") return ar_toasts_boost_permissionsupdatefailed2(inputs)
	if (locale === "fr") return fr_toasts_boost_permissionsupdatefailed2(inputs)
	return ko_toasts_boost_permissionsupdatefailed2(inputs)
});
export { toasts_boost_permissionsupdatefailed2 as "toasts.boost.permissionsUpdateFailed" }