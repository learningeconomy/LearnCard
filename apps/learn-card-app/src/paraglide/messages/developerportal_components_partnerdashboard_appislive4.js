/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Appislive4Inputs */

const en_developerportal_components_partnerdashboard_appislive4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Appislive4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app is live in the App Store`)
};

const es_developerportal_components_partnerdashboard_appislive4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Appislive4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu aplicación está activa en la Tienda de Apps`)
};

const fr_developerportal_components_partnerdashboard_appislive4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Appislive4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre application est en ligne dans l'App Store`)
};

const ar_developerportal_components_partnerdashboard_appislive4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Appislive4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقك نشط في متجر التطبيقات`)
};

/**
* | output |
* | --- |
* | "Your app is live in the App Store" |
*
* @param {Developerportal_Components_Partnerdashboard_Appislive4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_appislive4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Appislive4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Appislive4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_appislive4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_appislive4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_appislive4(inputs)
	return ar_developerportal_components_partnerdashboard_appislive4(inputs)
});
export { developerportal_components_partnerdashboard_appislive4 as "developerPortal.components.partnerDashboard.appIsLive" }