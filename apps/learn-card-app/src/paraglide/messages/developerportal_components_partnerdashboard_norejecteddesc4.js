/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Norejecteddesc4Inputs */

const en_developerportal_components_partnerdashboard_norejecteddesc4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Norejecteddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejected apps will appear here for review`)
};

const es_developerportal_components_partnerdashboard_norejecteddesc4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Norejecteddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Rejected apps will appear here for review]`)
};

const fr_developerportal_components_partnerdashboard_norejecteddesc4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Norejecteddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Rejected apps will appear here for review]`)
};

const ar_developerportal_components_partnerdashboard_norejecteddesc4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Norejecteddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Rejected apps will appear here for review]`)
};

/**
* | output |
* | --- |
* | "Rejected apps will appear here for review" |
*
* @param {Developerportal_Components_Partnerdashboard_Norejecteddesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_norejecteddesc4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Norejecteddesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Norejecteddesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_norejecteddesc4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_norejecteddesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_norejecteddesc4(inputs)
	return ar_developerportal_components_partnerdashboard_norejecteddesc4(inputs)
});
export { developerportal_components_partnerdashboard_norejecteddesc4 as "developerPortal.components.partnerDashboard.noRejectedDesc" }