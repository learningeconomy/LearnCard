/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Deliverymethod_Direct2Inputs */

const en_developerportal_dashboards_activity_deliverymethod_direct2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Deliverymethod_Direct2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Direct to Profile`)
};

const es_developerportal_dashboards_activity_deliverymethod_direct2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Deliverymethod_Direct2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Directo al Perfil`)
};

const fr_developerportal_dashboards_activity_deliverymethod_direct2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Deliverymethod_Direct2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Direct au Profil`)
};

const ar_developerportal_dashboards_activity_deliverymethod_direct2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Deliverymethod_Direct2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مباشر إلى الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Direct to Profile" |
*
* @param {Developerportal_Dashboards_Activity_Deliverymethod_Direct2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_deliverymethod_direct2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Deliverymethod_Direct2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Deliverymethod_Direct2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_deliverymethod_direct2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_deliverymethod_direct2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_deliverymethod_direct2(inputs)
	return ar_developerportal_dashboards_activity_deliverymethod_direct2(inputs)
});
export { developerportal_dashboards_activity_deliverymethod_direct2 as "developerPortal.dashboards.activity.deliveryMethod.direct" }