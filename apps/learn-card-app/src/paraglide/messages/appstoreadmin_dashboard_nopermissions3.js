/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Dashboard_Nopermissions3Inputs */

const en_appstoreadmin_dashboard_nopermissions3 = /** @type {(inputs: Appstoreadmin_Dashboard_Nopermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You don't have admin permissions.`)
};

const es_appstoreadmin_dashboard_nopermissions3 = /** @type {(inputs: Appstoreadmin_Dashboard_Nopermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No tienes permisos de administrador.`)
};

const fr_appstoreadmin_dashboard_nopermissions3 = /** @type {(inputs: Appstoreadmin_Dashboard_Nopermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'avez pas les permissions d'administrateur.`)
};

const ar_appstoreadmin_dashboard_nopermissions3 = /** @type {(inputs: Appstoreadmin_Dashboard_Nopermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ليست لديك صلاحيات المشرف.`)
};

/**
* | output |
* | --- |
* | "You don't have admin permissions." |
*
* @param {Appstoreadmin_Dashboard_Nopermissions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_dashboard_nopermissions3 = /** @type {((inputs?: Appstoreadmin_Dashboard_Nopermissions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Dashboard_Nopermissions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_dashboard_nopermissions3(inputs)
	if (locale === "es") return es_appstoreadmin_dashboard_nopermissions3(inputs)
	if (locale === "fr") return fr_appstoreadmin_dashboard_nopermissions3(inputs)
	return ar_appstoreadmin_dashboard_nopermissions3(inputs)
});
export { appstoreadmin_dashboard_nopermissions3 as "appStoreAdmin.dashboard.noPermissions" }