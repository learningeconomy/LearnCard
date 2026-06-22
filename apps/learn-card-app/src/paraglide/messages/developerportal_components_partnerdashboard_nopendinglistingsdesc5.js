/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Nopendinglistingsdesc5Inputs */

const en_developerportal_components_partnerdashboard_nopendinglistingsdesc5 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopendinglistingsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Submit drafts for review to see them here`)
};

const es_developerportal_components_partnerdashboard_nopendinglistingsdesc5 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopendinglistingsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Submit drafts for review to see them here`)
};

const fr_developerportal_components_partnerdashboard_nopendinglistingsdesc5 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopendinglistingsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Submit drafts for review to see them here`)
};

const ar_developerportal_components_partnerdashboard_nopendinglistingsdesc5 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopendinglistingsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Submit drafts for review to see them here`)
};

/**
* | output |
* | --- |
* | "Submit drafts for review to see them here" |
*
* @param {Developerportal_Components_Partnerdashboard_Nopendinglistingsdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_nopendinglistingsdesc5 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Nopendinglistingsdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Nopendinglistingsdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_nopendinglistingsdesc5(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_nopendinglistingsdesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_nopendinglistingsdesc5(inputs)
	return ar_developerportal_components_partnerdashboard_nopendinglistingsdesc5(inputs)
});
export { developerportal_components_partnerdashboard_nopendinglistingsdesc5 as "developerPortal.components.partnerDashboard.noPendingListingsDesc" }