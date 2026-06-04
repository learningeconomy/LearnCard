/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Consentflow_Permissionsupdatefailed3Inputs */

const en_toasts_consentflow_permissionsupdatefailed3 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdatefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to update permissions`)
};

const es_toasts_consentflow_permissionsupdatefailed3 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdatefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudieron actualizar los permisos`)
};

const de_toasts_consentflow_permissionsupdatefailed3 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdatefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigungen konnten nicht aktualisiert werden`)
};

const ar_toasts_consentflow_permissionsupdatefailed3 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdatefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر تحديث الأذونات`)
};

const fr_toasts_consentflow_permissionsupdatefailed3 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdatefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de mettre à jour les autorisations`)
};

const ko_toasts_consentflow_permissionsupdatefailed3 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdatefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`권한을 업데이트할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to update permissions" |
*
* @param {Toasts_Consentflow_Permissionsupdatefailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_consentflow_permissionsupdatefailed3 = /** @type {((inputs?: Toasts_Consentflow_Permissionsupdatefailed3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Consentflow_Permissionsupdatefailed3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_consentflow_permissionsupdatefailed3(inputs)
	if (locale === "es") return es_toasts_consentflow_permissionsupdatefailed3(inputs)
	if (locale === "de") return de_toasts_consentflow_permissionsupdatefailed3(inputs)
	if (locale === "ar") return ar_toasts_consentflow_permissionsupdatefailed3(inputs)
	if (locale === "fr") return fr_toasts_consentflow_permissionsupdatefailed3(inputs)
	return ko_toasts_consentflow_permissionsupdatefailed3(inputs)
});
export { toasts_consentflow_permissionsupdatefailed3 as "toasts.consentFlow.permissionsUpdateFailed" }