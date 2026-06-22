/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Understandnewlabel3Inputs */

const en_dashboard_quickactions_understandnewlabel3 = /** @type {(inputs: Dashboard_Quickactions_Understandnewlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Skill Profile`)
};

const es_dashboard_quickactions_understandnewlabel3 = /** @type {(inputs: Dashboard_Quickactions_Understandnewlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear perfil de habilidades`)
};

const fr_dashboard_quickactions_understandnewlabel3 = /** @type {(inputs: Dashboard_Quickactions_Understandnewlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un profil de compétences`)
};

const ar_dashboard_quickactions_understandnewlabel3 = /** @type {(inputs: Dashboard_Quickactions_Understandnewlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء ملف المهارات`)
};

/**
* | output |
* | --- |
* | "Create Skill Profile" |
*
* @param {Dashboard_Quickactions_Understandnewlabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_understandnewlabel3 = /** @type {((inputs?: Dashboard_Quickactions_Understandnewlabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Understandnewlabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_understandnewlabel3(inputs)
	if (locale === "es") return es_dashboard_quickactions_understandnewlabel3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_understandnewlabel3(inputs)
	return ar_dashboard_quickactions_understandnewlabel3(inputs)
});
export { dashboard_quickactions_understandnewlabel3 as "dashboard.quickActions.understandNewLabel" }