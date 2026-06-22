/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Nospecialpermissions3Inputs */

const en_appinstall_nospecialpermissions3 = /** @type {(inputs: Appinstall_Nospecialpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This app doesn't require any special permissions.`)
};

const es_appinstall_nospecialpermissions3 = /** @type {(inputs: Appinstall_Nospecialpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta aplicación no requiere permisos especiales.`)
};

const fr_appinstall_nospecialpermissions3 = /** @type {(inputs: Appinstall_Nospecialpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette application ne nécessite aucune autorisation spéciale.`)
};

const ar_appinstall_nospecialpermissions3 = /** @type {(inputs: Appinstall_Nospecialpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يتطلب هذا التطبيق أي أذونات خاصة.`)
};

/**
* | output |
* | --- |
* | "This app doesn't require any special permissions." |
*
* @param {Appinstall_Nospecialpermissions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_nospecialpermissions3 = /** @type {((inputs?: Appinstall_Nospecialpermissions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Nospecialpermissions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_nospecialpermissions3(inputs)
	if (locale === "es") return es_appinstall_nospecialpermissions3(inputs)
	if (locale === "fr") return fr_appinstall_nospecialpermissions3(inputs)
	return ar_appinstall_nospecialpermissions3(inputs)
});
export { appinstall_nospecialpermissions3 as "appInstall.noSpecialPermissions" }