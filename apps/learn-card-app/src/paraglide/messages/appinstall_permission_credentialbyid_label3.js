/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Permission_Credentialbyid_Label3Inputs */

const en_appinstall_permission_credentialbyid_label3 = /** @type {(inputs: Appinstall_Permission_Credentialbyid_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Access Credentials`)
};

const es_appinstall_permission_credentialbyid_label3 = /** @type {(inputs: Appinstall_Permission_Credentialbyid_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceder a credenciales`)
};

const fr_appinstall_permission_credentialbyid_label3 = /** @type {(inputs: Appinstall_Permission_Credentialbyid_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accéder aux justificatifs`)
};

const ar_appinstall_permission_credentialbyid_label3 = /** @type {(inputs: Appinstall_Permission_Credentialbyid_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوصول إلى بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Access Credentials" |
*
* @param {Appinstall_Permission_Credentialbyid_Label3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_permission_credentialbyid_label3 = /** @type {((inputs?: Appinstall_Permission_Credentialbyid_Label3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Permission_Credentialbyid_Label3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_permission_credentialbyid_label3(inputs)
	if (locale === "es") return es_appinstall_permission_credentialbyid_label3(inputs)
	if (locale === "fr") return fr_appinstall_permission_credentialbyid_label3(inputs)
	return ar_appinstall_permission_credentialbyid_label3(inputs)
});
export { appinstall_permission_credentialbyid_label3 as "appInstall.permission.credentialById.label" }