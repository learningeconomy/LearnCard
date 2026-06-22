/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Checklist_Addcredential1Inputs */

const en_dashboard_checklist_addcredential1 = /** @type {(inputs: Dashboard_Checklist_Addcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add your first credential`)
};

const es_dashboard_checklist_addcredential1 = /** @type {(inputs: Dashboard_Checklist_Addcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega tu primera credencial`)
};

const fr_dashboard_checklist_addcredential1 = /** @type {(inputs: Dashboard_Checklist_Addcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez votre première certification`)
};

const ar_dashboard_checklist_addcredential1 = /** @type {(inputs: Dashboard_Checklist_Addcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف شهادتك الأولى`)
};

/**
* | output |
* | --- |
* | "Add your first credential" |
*
* @param {Dashboard_Checklist_Addcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_checklist_addcredential1 = /** @type {((inputs?: Dashboard_Checklist_Addcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Checklist_Addcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_checklist_addcredential1(inputs)
	if (locale === "es") return es_dashboard_checklist_addcredential1(inputs)
	if (locale === "fr") return fr_dashboard_checklist_addcredential1(inputs)
	return ar_dashboard_checklist_addcredential1(inputs)
});
export { dashboard_checklist_addcredential1 as "dashboard.checklist.addCredential" }