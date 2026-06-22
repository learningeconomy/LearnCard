/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Permission_Launchfeature_Description2Inputs */

const en_appinstall_permission_launchfeature_description2 = /** @type {(inputs: Appinstall_Permission_Launchfeature_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open wallet features programmatically`)
};

const es_appinstall_permission_launchfeature_description2 = /** @type {(inputs: Appinstall_Permission_Launchfeature_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir funciones de la cartera de forma programática`)
};

const fr_appinstall_permission_launchfeature_description2 = /** @type {(inputs: Appinstall_Permission_Launchfeature_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir des fonctionnalités du portefeuille de façon programmatique`)
};

const ar_appinstall_permission_launchfeature_description2 = /** @type {(inputs: Appinstall_Permission_Launchfeature_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح ميزات المحفظة برمجيًا`)
};

/**
* | output |
* | --- |
* | "Open wallet features programmatically" |
*
* @param {Appinstall_Permission_Launchfeature_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_permission_launchfeature_description2 = /** @type {((inputs?: Appinstall_Permission_Launchfeature_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Permission_Launchfeature_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_permission_launchfeature_description2(inputs)
	if (locale === "es") return es_appinstall_permission_launchfeature_description2(inputs)
	if (locale === "fr") return fr_appinstall_permission_launchfeature_description2(inputs)
	return ar_appinstall_permission_launchfeature_description2(inputs)
});
export { appinstall_permission_launchfeature_description2 as "appInstall.permission.launchFeature.description" }