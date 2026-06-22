/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Permission_Requestconsent_Description2Inputs */

const en_appinstall_permission_requestconsent_description2 = /** @type {(inputs: Appinstall_Permission_Requestconsent_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask for your consent to access or share data`)
};

const es_appinstall_permission_requestconsent_description2 = /** @type {(inputs: Appinstall_Permission_Requestconsent_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pedir tu consentimiento para acceder o compartir datos`)
};

const fr_appinstall_permission_requestconsent_description2 = /** @type {(inputs: Appinstall_Permission_Requestconsent_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander votre consentement pour accéder aux données ou les partager`)
};

const ar_appinstall_permission_requestconsent_description2 = /** @type {(inputs: Appinstall_Permission_Requestconsent_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب موافقتك للوصول إلى البيانات أو مشاركتها`)
};

/**
* | output |
* | --- |
* | "Ask for your consent to access or share data" |
*
* @param {Appinstall_Permission_Requestconsent_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_permission_requestconsent_description2 = /** @type {((inputs?: Appinstall_Permission_Requestconsent_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Permission_Requestconsent_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_permission_requestconsent_description2(inputs)
	if (locale === "es") return es_appinstall_permission_requestconsent_description2(inputs)
	if (locale === "fr") return fr_appinstall_permission_requestconsent_description2(inputs)
	return ar_appinstall_permission_requestconsent_description2(inputs)
});
export { appinstall_permission_requestconsent_description2 as "appInstall.permission.requestConsent.description" }