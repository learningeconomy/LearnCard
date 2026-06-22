/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Requestingpermissions2Inputs */

const en_appinstall_requestingpermissions2 = /** @type {(inputs: Appinstall_Requestingpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This app is requesting the following permissions`)
};

const es_appinstall_requestingpermissions2 = /** @type {(inputs: Appinstall_Requestingpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta aplicación solicita los siguientes permisos`)
};

const fr_appinstall_requestingpermissions2 = /** @type {(inputs: Appinstall_Requestingpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette application demande les autorisations suivantes`)
};

const ar_appinstall_requestingpermissions2 = /** @type {(inputs: Appinstall_Requestingpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يطلب هذا التطبيق الأذونات التالية`)
};

/**
* | output |
* | --- |
* | "This app is requesting the following permissions" |
*
* @param {Appinstall_Requestingpermissions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_requestingpermissions2 = /** @type {((inputs?: Appinstall_Requestingpermissions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Requestingpermissions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_requestingpermissions2(inputs)
	if (locale === "es") return es_appinstall_requestingpermissions2(inputs)
	if (locale === "fr") return fr_appinstall_requestingpermissions2(inputs)
	return ar_appinstall_requestingpermissions2(inputs)
});
export { appinstall_requestingpermissions2 as "appInstall.requestingPermissions" }