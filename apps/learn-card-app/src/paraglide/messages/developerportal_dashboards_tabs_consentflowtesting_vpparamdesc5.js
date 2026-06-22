/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparamdesc5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparamdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A VP JWT proving consent. Verify this server-side to confirm authorization.`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparamdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un VP JWT que prueba el consentimiento. Verifícalo del lado del servidor para confirmar la autorización.`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparamdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un VP JWT prouvant le consentement. Vérifiez-le côté serveur pour confirmer l'autorisation.`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparamdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز VP JWT يثبت الموافقة. تحقق من صحته من جانب الخادم لتأكيد التفويض.`)
};

/**
* | output |
* | --- |
* | "A VP JWT proving consent. Verify this server-side to confirm authorization." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparamdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparamdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparamdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_vpparamdesc5 as "developerPortal.dashboards.tabs.consentFlowTesting.vpParamDesc" }