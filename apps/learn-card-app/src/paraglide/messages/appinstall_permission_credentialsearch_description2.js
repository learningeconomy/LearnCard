/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Permission_Credentialsearch_Description2Inputs */

const en_appinstall_permission_credentialsearch_description2 = /** @type {(inputs: Appinstall_Permission_Credentialsearch_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search through your stored credentials`)
};

const es_appinstall_permission_credentialsearch_description2 = /** @type {(inputs: Appinstall_Permission_Credentialsearch_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar entre tus credenciales almacenadas`)
};

const fr_appinstall_permission_credentialsearch_description2 = /** @type {(inputs: Appinstall_Permission_Credentialsearch_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher parmi vos justificatifs stockés`)
};

const ar_appinstall_permission_credentialsearch_description2 = /** @type {(inputs: Appinstall_Permission_Credentialsearch_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث ضمن بيانات الاعتماد المخزّنة`)
};

/**
* | output |
* | --- |
* | "Search through your stored credentials" |
*
* @param {Appinstall_Permission_Credentialsearch_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_permission_credentialsearch_description2 = /** @type {((inputs?: Appinstall_Permission_Credentialsearch_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Permission_Credentialsearch_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_permission_credentialsearch_description2(inputs)
	if (locale === "es") return es_appinstall_permission_credentialsearch_description2(inputs)
	if (locale === "fr") return fr_appinstall_permission_credentialsearch_description2(inputs)
	return ar_appinstall_permission_credentialsearch_description2(inputs)
});
export { appinstall_permission_credentialsearch_description2 as "appInstall.permission.credentialSearch.description" }