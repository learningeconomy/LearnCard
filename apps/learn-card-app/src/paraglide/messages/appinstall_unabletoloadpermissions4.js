/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Unabletoloadpermissions4Inputs */

const en_appinstall_unabletoloadpermissions4 = /** @type {(inputs: Appinstall_Unabletoloadpermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to load data permissions for this app.`)
};

const es_appinstall_unabletoloadpermissions4 = /** @type {(inputs: Appinstall_Unabletoloadpermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudieron cargar los permisos de datos de esta aplicación.`)
};

const fr_appinstall_unabletoloadpermissions4 = /** @type {(inputs: Appinstall_Unabletoloadpermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de charger les autorisations de données de cette application.`)
};

const ar_appinstall_unabletoloadpermissions4 = /** @type {(inputs: Appinstall_Unabletoloadpermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر تحميل أذونات البيانات لهذا التطبيق.`)
};

/**
* | output |
* | --- |
* | "Unable to load data permissions for this app." |
*
* @param {Appinstall_Unabletoloadpermissions4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_unabletoloadpermissions4 = /** @type {((inputs?: Appinstall_Unabletoloadpermissions4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Unabletoloadpermissions4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_unabletoloadpermissions4(inputs)
	if (locale === "es") return es_appinstall_unabletoloadpermissions4(inputs)
	if (locale === "fr") return fr_appinstall_unabletoloadpermissions4(inputs)
	return ar_appinstall_unabletoloadpermissions4(inputs)
});
export { appinstall_unabletoloadpermissions4 as "appInstall.unableToLoadPermissions" }