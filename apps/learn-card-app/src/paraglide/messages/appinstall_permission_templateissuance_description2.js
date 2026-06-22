/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Permission_Templateissuance_Description2Inputs */

const en_appinstall_permission_templateissuance_description2 = /** @type {(inputs: Appinstall_Permission_Templateissuance_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create and issue credentials from templates`)
};

const es_appinstall_permission_templateissuance_description2 = /** @type {(inputs: Appinstall_Permission_Templateissuance_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear y emitir credenciales a partir de plantillas`)
};

const fr_appinstall_permission_templateissuance_description2 = /** @type {(inputs: Appinstall_Permission_Templateissuance_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer et émettre des justificatifs à partir de modèles`)
};

const ar_appinstall_permission_templateissuance_description2 = /** @type {(inputs: Appinstall_Permission_Templateissuance_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء وإصدار بيانات اعتماد من القوالب`)
};

/**
* | output |
* | --- |
* | "Create and issue credentials from templates" |
*
* @param {Appinstall_Permission_Templateissuance_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_permission_templateissuance_description2 = /** @type {((inputs?: Appinstall_Permission_Templateissuance_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Permission_Templateissuance_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_permission_templateissuance_description2(inputs)
	if (locale === "es") return es_appinstall_permission_templateissuance_description2(inputs)
	if (locale === "fr") return fr_appinstall_permission_templateissuance_description2(inputs)
	return ar_appinstall_permission_templateissuance_description2(inputs)
});
export { appinstall_permission_templateissuance_description2 as "appInstall.permission.templateIssuance.description" }