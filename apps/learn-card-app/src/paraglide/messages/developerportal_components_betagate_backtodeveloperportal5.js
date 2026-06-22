/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Backtodeveloperportal5Inputs */

const en_developerportal_components_betagate_backtodeveloperportal5 = /** @type {(inputs: Developerportal_Components_Betagate_Backtodeveloperportal5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← Back to Developer Portal`)
};

const es_developerportal_components_betagate_backtodeveloperportal5 = /** @type {(inputs: Developerportal_Components_Betagate_Backtodeveloperportal5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← Volver al Portal de Desarrolladores`)
};

const fr_developerportal_components_betagate_backtodeveloperportal5 = /** @type {(inputs: Developerportal_Components_Betagate_Backtodeveloperportal5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← Retour au Portail Développeur`)
};

const ar_developerportal_components_betagate_backtodeveloperportal5 = /** @type {(inputs: Developerportal_Components_Betagate_Backtodeveloperportal5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← العودة إلى بوابة المطورين`)
};

/**
* | output |
* | --- |
* | "← Back to Developer Portal" |
*
* @param {Developerportal_Components_Betagate_Backtodeveloperportal5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_backtodeveloperportal5 = /** @type {((inputs?: Developerportal_Components_Betagate_Backtodeveloperportal5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Backtodeveloperportal5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_backtodeveloperportal5(inputs)
	if (locale === "es") return es_developerportal_components_betagate_backtodeveloperportal5(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_backtodeveloperportal5(inputs)
	return ar_developerportal_components_betagate_backtodeveloperportal5(inputs)
});
export { developerportal_components_betagate_backtodeveloperportal5 as "developerPortal.components.betaGate.backToDeveloperPortal" }