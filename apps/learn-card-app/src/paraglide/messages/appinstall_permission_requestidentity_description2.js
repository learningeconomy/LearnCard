/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Permission_Requestidentity_Description2Inputs */

const en_appinstall_permission_requestidentity_description2 = /** @type {(inputs: Appinstall_Permission_Requestidentity_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View your profile information and verify your identity`)
};

const es_appinstall_permission_requestidentity_description2 = /** @type {(inputs: Appinstall_Permission_Requestidentity_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver la información de tu perfil y verificar tu identidad`)
};

const fr_appinstall_permission_requestidentity_description2 = /** @type {(inputs: Appinstall_Permission_Requestidentity_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir les informations de votre profil et vérifier votre identité`)
};

const ar_appinstall_permission_requestidentity_description2 = /** @type {(inputs: Appinstall_Permission_Requestidentity_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض معلومات ملفك الشخصي والتحقق من هويتك`)
};

/**
* | output |
* | --- |
* | "View your profile information and verify your identity" |
*
* @param {Appinstall_Permission_Requestidentity_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_permission_requestidentity_description2 = /** @type {((inputs?: Appinstall_Permission_Requestidentity_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Permission_Requestidentity_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_permission_requestidentity_description2(inputs)
	if (locale === "es") return es_appinstall_permission_requestidentity_description2(inputs)
	if (locale === "fr") return fr_appinstall_permission_requestidentity_description2(inputs)
	return ar_appinstall_permission_requestidentity_description2(inputs)
});
export { appinstall_permission_requestidentity_description2 as "appInstall.permission.requestIdentity.description" }