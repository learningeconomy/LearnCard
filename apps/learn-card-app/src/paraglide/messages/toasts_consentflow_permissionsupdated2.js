/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Consentflow_Permissionsupdated2Inputs */

const en_toasts_consentflow_permissionsupdated2 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permissions updated`)
};

const es_toasts_consentflow_permissionsupdated2 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos actualizados`)
};

const fr_toasts_consentflow_permissionsupdated2 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisations mises à jour`)
};

const ar_toasts_consentflow_permissionsupdated2 = /** @type {(inputs: Toasts_Consentflow_Permissionsupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث الأذونات`)
};

/**
* | output |
* | --- |
* | "Permissions updated" |
*
* @param {Toasts_Consentflow_Permissionsupdated2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_consentflow_permissionsupdated2 = /** @type {((inputs?: Toasts_Consentflow_Permissionsupdated2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Consentflow_Permissionsupdated2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_consentflow_permissionsupdated2(inputs)
	if (locale === "es") return es_toasts_consentflow_permissionsupdated2(inputs)
	if (locale === "fr") return fr_toasts_consentflow_permissionsupdated2(inputs)
	return ar_toasts_consentflow_permissionsupdated2(inputs)
});
export { toasts_consentflow_permissionsupdated2 as "toasts.consentFlow.permissionsUpdated" }