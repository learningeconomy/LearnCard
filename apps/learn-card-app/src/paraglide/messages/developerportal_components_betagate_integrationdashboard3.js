/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Integrationdashboard3Inputs */

const en_developerportal_components_betagate_integrationdashboard3 = /** @type {(inputs: Developerportal_Components_Betagate_Integrationdashboard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration dashboard`)
};

const es_developerportal_components_betagate_integrationdashboard3 = /** @type {(inputs: Developerportal_Components_Betagate_Integrationdashboard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panel de integración`)
};

const fr_developerportal_components_betagate_integrationdashboard3 = /** @type {(inputs: Developerportal_Components_Betagate_Integrationdashboard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de bord d'intégration`)
};

const ar_developerportal_components_betagate_integrationdashboard3 = /** @type {(inputs: Developerportal_Components_Betagate_Integrationdashboard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لوحة تحكم التكامل`)
};

/**
* | output |
* | --- |
* | "Integration dashboard" |
*
* @param {Developerportal_Components_Betagate_Integrationdashboard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_integrationdashboard3 = /** @type {((inputs?: Developerportal_Components_Betagate_Integrationdashboard3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Integrationdashboard3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_integrationdashboard3(inputs)
	if (locale === "es") return es_developerportal_components_betagate_integrationdashboard3(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_integrationdashboard3(inputs)
	return ar_developerportal_components_betagate_integrationdashboard3(inputs)
});
export { developerportal_components_betagate_integrationdashboard3 as "developerPortal.components.betaGate.integrationDashboard" }