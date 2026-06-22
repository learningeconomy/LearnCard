/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Templatedatadesc4Inputs */

const en_developerportal_dashboards_tabs_integrationcode_templatedatadesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Templatedatadesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter example values for your credential. These will appear in the generated code.`)
};

const es_developerportal_dashboards_tabs_integrationcode_templatedatadesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Templatedatadesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa valores de ejemplo para tu credencial. Aparecerán en el código generado.`)
};

const fr_developerportal_dashboards_tabs_integrationcode_templatedatadesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Templatedatadesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisissez des valeurs d'exemple pour votre justificatif. Elles apparaîtront dans le code généré.`)
};

const ar_developerportal_dashboards_tabs_integrationcode_templatedatadesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Templatedatadesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدخل قيمًا مثاليه لمؤهلك. ستظهر في الكود المُنشأ.`)
};

/**
* | output |
* | --- |
* | "Enter example values for your credential. These will appear in the generated code." |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Templatedatadesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_templatedatadesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Templatedatadesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Templatedatadesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_templatedatadesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_templatedatadesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_templatedatadesc4(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_templatedatadesc4(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_templatedatadesc4 as "developerPortal.dashboards.tabs.integrationCode.templateDataDesc" }