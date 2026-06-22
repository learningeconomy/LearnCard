/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Preview2Inputs */

const en_developerportal_components_partnerdashboard_preview2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Preview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview`)
};

const es_developerportal_components_partnerdashboard_preview2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Preview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa`)
};

const fr_developerportal_components_partnerdashboard_preview2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Preview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu`)
};

const ar_developerportal_components_partnerdashboard_preview2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Preview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة`)
};

/**
* | output |
* | --- |
* | "Preview" |
*
* @param {Developerportal_Components_Partnerdashboard_Preview2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_preview2 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Preview2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Preview2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_preview2(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_preview2(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_preview2(inputs)
	return ar_developerportal_components_partnerdashboard_preview2(inputs)
});
export { developerportal_components_partnerdashboard_preview2 as "developerPortal.components.partnerDashboard.preview" }