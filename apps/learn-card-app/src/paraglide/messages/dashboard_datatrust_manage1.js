/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Datatrust_Manage1Inputs */

const en_dashboard_datatrust_manage1 = /** @type {(inputs: Dashboard_Datatrust_Manage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage data sharing`)
};

const es_dashboard_datatrust_manage1 = /** @type {(inputs: Dashboard_Datatrust_Manage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar el uso compartido de datos`)
};

const fr_dashboard_datatrust_manage1 = /** @type {(inputs: Dashboard_Datatrust_Manage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer le partage de données`)
};

const ar_dashboard_datatrust_manage1 = /** @type {(inputs: Dashboard_Datatrust_Manage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة مشاركة البيانات`)
};

/**
* | output |
* | --- |
* | "Manage data sharing" |
*
* @param {Dashboard_Datatrust_Manage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_datatrust_manage1 = /** @type {((inputs?: Dashboard_Datatrust_Manage1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Datatrust_Manage1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_datatrust_manage1(inputs)
	if (locale === "es") return es_dashboard_datatrust_manage1(inputs)
	if (locale === "fr") return fr_dashboard_datatrust_manage1(inputs)
	return ar_dashboard_datatrust_manage1(inputs)
});
export { dashboard_datatrust_manage1 as "dashboard.dataTrust.manage" }