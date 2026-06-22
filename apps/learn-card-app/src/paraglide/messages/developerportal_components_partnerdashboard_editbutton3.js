/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Editbutton3Inputs */

const en_developerportal_components_partnerdashboard_editbutton3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Editbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

const es_developerportal_components_partnerdashboard_editbutton3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Editbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Edit]`)
};

const fr_developerportal_components_partnerdashboard_editbutton3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Editbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Edit]`)
};

const ar_developerportal_components_partnerdashboard_editbutton3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Editbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Edit]`)
};

/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Developerportal_Components_Partnerdashboard_Editbutton3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_editbutton3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Editbutton3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Editbutton3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_editbutton3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_editbutton3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_editbutton3(inputs)
	return ar_developerportal_components_partnerdashboard_editbutton3(inputs)
});
export { developerportal_components_partnerdashboard_editbutton3 as "developerPortal.components.partnerDashboard.editButton" }