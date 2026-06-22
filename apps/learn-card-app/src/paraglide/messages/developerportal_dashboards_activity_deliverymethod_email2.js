/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Deliverymethod_Email2Inputs */

const en_developerportal_dashboards_activity_deliverymethod_email2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Deliverymethod_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Delivery`)
};

const es_developerportal_dashboards_activity_deliverymethod_email2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Deliverymethod_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entrega por Correo`)
};

const fr_developerportal_dashboards_activity_deliverymethod_email2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Deliverymethod_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Livraison par E-mail`)
};

const ar_developerportal_dashboards_activity_deliverymethod_email2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Deliverymethod_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التسليم عبر البريد`)
};

/**
* | output |
* | --- |
* | "Email Delivery" |
*
* @param {Developerportal_Dashboards_Activity_Deliverymethod_Email2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_deliverymethod_email2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Deliverymethod_Email2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Deliverymethod_Email2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_deliverymethod_email2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_deliverymethod_email2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_deliverymethod_email2(inputs)
	return ar_developerportal_dashboards_activity_deliverymethod_email2(inputs)
});
export { developerportal_dashboards_activity_deliverymethod_email2 as "developerPortal.dashboards.activity.deliveryMethod.email" }