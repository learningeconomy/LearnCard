/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Templates_Footnote1Inputs */

const en_developerportal_dashboards_tabs_templates_footnote1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Templates_Footnote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`See the Code tab for send examples using your template URIs.`)
};

const es_developerportal_dashboards_tabs_templates_footnote1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Templates_Footnote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mira la pestaña Código para ejemplos de envío usando tus URIs de plantilla.`)
};

const fr_developerportal_dashboards_tabs_templates_footnote1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Templates_Footnote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consultez l'onglet Code pour des exemples d'envoi utilisant vos URI de modèle.`)
};

const ar_developerportal_dashboards_tabs_templates_footnote1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Templates_Footnote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`راجع علامة تبويب الكود للحصول على أمثلة إرسال تستخدم روابط القالب الخاصة بك.`)
};

/**
* | output |
* | --- |
* | "See the Code tab for send examples using your template URIs." |
*
* @param {Developerportal_Dashboards_Tabs_Templates_Footnote1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_templates_footnote1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Templates_Footnote1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Templates_Footnote1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_templates_footnote1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_templates_footnote1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_templates_footnote1(inputs)
	return ar_developerportal_dashboards_tabs_templates_footnote1(inputs)
});
export { developerportal_dashboards_tabs_templates_footnote1 as "developerPortal.dashboards.tabs.templates.footnote" }