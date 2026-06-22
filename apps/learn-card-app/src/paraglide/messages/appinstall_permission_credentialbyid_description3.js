/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Permission_Credentialbyid_Description3Inputs */

const en_appinstall_permission_credentialbyid_description3 = /** @type {(inputs: Appinstall_Permission_Credentialbyid_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve specific credentials by their ID`)
};

const es_appinstall_permission_credentialbyid_description3 = /** @type {(inputs: Appinstall_Permission_Credentialbyid_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperar credenciales específicas por su ID`)
};

const fr_appinstall_permission_credentialbyid_description3 = /** @type {(inputs: Appinstall_Permission_Credentialbyid_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupérer des justificatifs spécifiques par leur ID`)
};

const ar_appinstall_permission_credentialbyid_description3 = /** @type {(inputs: Appinstall_Permission_Credentialbyid_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استرداد بيانات اعتماد محددة عبر معرّفها`)
};

/**
* | output |
* | --- |
* | "Retrieve specific credentials by their ID" |
*
* @param {Appinstall_Permission_Credentialbyid_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_permission_credentialbyid_description3 = /** @type {((inputs?: Appinstall_Permission_Credentialbyid_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Permission_Credentialbyid_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_permission_credentialbyid_description3(inputs)
	if (locale === "es") return es_appinstall_permission_credentialbyid_description3(inputs)
	if (locale === "fr") return fr_appinstall_permission_credentialbyid_description3(inputs)
	return ar_appinstall_permission_credentialbyid_description3(inputs)
});
export { appinstall_permission_credentialbyid_description3 as "appInstall.permission.credentialById.description" }