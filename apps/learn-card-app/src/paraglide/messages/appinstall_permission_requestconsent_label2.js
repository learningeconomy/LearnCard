/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Permission_Requestconsent_Label2Inputs */

const en_appinstall_permission_requestconsent_label2 = /** @type {(inputs: Appinstall_Permission_Requestconsent_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Consent`)
};

const es_appinstall_permission_requestconsent_label2 = /** @type {(inputs: Appinstall_Permission_Requestconsent_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar consentimiento`)
};

const fr_appinstall_permission_requestconsent_label2 = /** @type {(inputs: Appinstall_Permission_Requestconsent_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander le consentement`)
};

const ar_appinstall_permission_requestconsent_label2 = /** @type {(inputs: Appinstall_Permission_Requestconsent_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الموافقة`)
};

/**
* | output |
* | --- |
* | "Request Consent" |
*
* @param {Appinstall_Permission_Requestconsent_Label2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_permission_requestconsent_label2 = /** @type {((inputs?: Appinstall_Permission_Requestconsent_Label2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Permission_Requestconsent_Label2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_permission_requestconsent_label2(inputs)
	if (locale === "es") return es_appinstall_permission_requestconsent_label2(inputs)
	if (locale === "fr") return fr_appinstall_permission_requestconsent_label2(inputs)
	return ar_appinstall_permission_requestconsent_label2(inputs)
});
export { appinstall_permission_requestconsent_label2 as "appInstall.permission.requestConsent.label" }