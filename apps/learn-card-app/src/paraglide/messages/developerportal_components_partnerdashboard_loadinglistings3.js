/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Loadinglistings3Inputs */

const en_developerportal_components_partnerdashboard_loadinglistings3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Loadinglistings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading listings...`)
};

const es_developerportal_components_partnerdashboard_loadinglistings3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Loadinglistings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando listados...`)
};

const fr_developerportal_components_partnerdashboard_loadinglistings3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Loadinglistings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des annonces...`)
};

const ar_developerportal_components_partnerdashboard_loadinglistings3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Loadinglistings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل القوائم...`)
};

/**
* | output |
* | --- |
* | "Loading listings..." |
*
* @param {Developerportal_Components_Partnerdashboard_Loadinglistings3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_loadinglistings3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Loadinglistings3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Loadinglistings3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_loadinglistings3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_loadinglistings3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_loadinglistings3(inputs)
	return ar_developerportal_components_partnerdashboard_loadinglistings3(inputs)
});
export { developerportal_components_partnerdashboard_loadinglistings3 as "developerPortal.components.partnerDashboard.loadingListings" }