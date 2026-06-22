/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Apprejected3Inputs */

const en_developerportal_components_partnerdashboard_apprejected3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Apprejected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This app was rejected. Contact an admin for revision.`)
};

const es_developerportal_components_partnerdashboard_apprejected3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Apprejected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta aplicación fue rechazada. Contacta a un administrador para revisión.`)
};

const fr_developerportal_components_partnerdashboard_apprejected3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Apprejected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette application a été rejetée. Contactez un administrateur pour révision.`)
};

const ar_developerportal_components_partnerdashboard_apprejected3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Apprejected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم رفض هذا التطبيق. اتصل بالمدير للمراجعة.`)
};

/**
* | output |
* | --- |
* | "This app was rejected. Contact an admin for revision." |
*
* @param {Developerportal_Components_Partnerdashboard_Apprejected3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_apprejected3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Apprejected3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Apprejected3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_apprejected3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_apprejected3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_apprejected3(inputs)
	return ar_developerportal_components_partnerdashboard_apprejected3(inputs)
});
export { developerportal_components_partnerdashboard_apprejected3 as "developerPortal.components.partnerDashboard.appRejected" }