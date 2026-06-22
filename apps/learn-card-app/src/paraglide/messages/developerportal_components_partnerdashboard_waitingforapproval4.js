/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Waitingforapproval4Inputs */

const en_developerportal_components_partnerdashboard_waitingforapproval4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Waitingforapproval4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting for admin approval`)
};

const es_developerportal_components_partnerdashboard_waitingforapproval4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Waitingforapproval4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esperando aprobación del administrador`)
};

const fr_developerportal_components_partnerdashboard_waitingforapproval4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Waitingforapproval4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente d'approbation de l'administrateur`)
};

const ar_developerportal_components_partnerdashboard_waitingforapproval4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Waitingforapproval4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتظار موافقة المدير`)
};

/**
* | output |
* | --- |
* | "Waiting for admin approval" |
*
* @param {Developerportal_Components_Partnerdashboard_Waitingforapproval4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_waitingforapproval4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Waitingforapproval4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Waitingforapproval4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_waitingforapproval4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_waitingforapproval4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_waitingforapproval4(inputs)
	return ar_developerportal_components_partnerdashboard_waitingforapproval4(inputs)
});
export { developerportal_components_partnerdashboard_waitingforapproval4 as "developerPortal.components.partnerDashboard.waitingForApproval" }