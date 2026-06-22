/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Selectlisting3Inputs */

const en_developerportal_components_partnerdashboard_selectlisting3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Selectlisting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a listing to view details`)
};

const es_developerportal_components_partnerdashboard_selectlisting3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Selectlisting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un listado para ver detalles`)
};

const fr_developerportal_components_partnerdashboard_selectlisting3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Selectlisting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez une annonce pour voir les détails`)
};

const ar_developerportal_components_partnerdashboard_selectlisting3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Selectlisting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر قائمة لعرض التفاصيل`)
};

/**
* | output |
* | --- |
* | "Select a listing to view details" |
*
* @param {Developerportal_Components_Partnerdashboard_Selectlisting3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_selectlisting3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Selectlisting3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Selectlisting3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_selectlisting3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_selectlisting3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_selectlisting3(inputs)
	return ar_developerportal_components_partnerdashboard_selectlisting3(inputs)
});
export { developerportal_components_partnerdashboard_selectlisting3 as "developerPortal.components.partnerDashboard.selectListing" }