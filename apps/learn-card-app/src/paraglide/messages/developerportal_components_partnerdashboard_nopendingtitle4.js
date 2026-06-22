/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Nopendingtitle4Inputs */

const en_developerportal_components_partnerdashboard_nopendingtitle4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopendingtitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No pending listings`)
};

const es_developerportal_components_partnerdashboard_nopendingtitle4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopendingtitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[No pending listings]`)
};

const fr_developerportal_components_partnerdashboard_nopendingtitle4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopendingtitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[No pending listings]`)
};

const ar_developerportal_components_partnerdashboard_nopendingtitle4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopendingtitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[No pending listings]`)
};

/**
* | output |
* | --- |
* | "No pending listings" |
*
* @param {Developerportal_Components_Partnerdashboard_Nopendingtitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_nopendingtitle4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Nopendingtitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Nopendingtitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_nopendingtitle4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_nopendingtitle4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_nopendingtitle4(inputs)
	return ar_developerportal_components_partnerdashboard_nopendingtitle4(inputs)
});
export { developerportal_components_partnerdashboard_nopendingtitle4 as "developerPortal.components.partnerDashboard.noPendingTitle" }