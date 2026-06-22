/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Loadingdatapermissions3Inputs */

const en_appinstall_loadingdatapermissions3 = /** @type {(inputs: Appinstall_Loadingdatapermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading data permissions...`)
};

const es_appinstall_loadingdatapermissions3 = /** @type {(inputs: Appinstall_Loadingdatapermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando permisos de datos...`)
};

const fr_appinstall_loadingdatapermissions3 = /** @type {(inputs: Appinstall_Loadingdatapermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des autorisations de données...`)
};

const ar_appinstall_loadingdatapermissions3 = /** @type {(inputs: Appinstall_Loadingdatapermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل أذونات البيانات...`)
};

/**
* | output |
* | --- |
* | "Loading data permissions..." |
*
* @param {Appinstall_Loadingdatapermissions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_loadingdatapermissions3 = /** @type {((inputs?: Appinstall_Loadingdatapermissions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Loadingdatapermissions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_loadingdatapermissions3(inputs)
	if (locale === "es") return es_appinstall_loadingdatapermissions3(inputs)
	if (locale === "fr") return fr_appinstall_loadingdatapermissions3(inputs)
	return ar_appinstall_loadingdatapermissions3(inputs)
});
export { appinstall_loadingdatapermissions3 as "appInstall.loadingDataPermissions" }