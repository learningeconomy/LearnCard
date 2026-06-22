/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Welcometobeta4Inputs */

const en_developerportal_components_betagate_welcometobeta4 = /** @type {(inputs: Developerportal_Components_Betagate_Welcometobeta4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Welcome to the Beta!`)
};

const es_developerportal_components_betagate_welcometobeta4 = /** @type {(inputs: Developerportal_Components_Betagate_Welcometobeta4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Bienvenido a la Beta!`)
};

const fr_developerportal_components_betagate_welcometobeta4 = /** @type {(inputs: Developerportal_Components_Betagate_Welcometobeta4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bienvenue dans la Beta !`)
};

const ar_developerportal_components_betagate_welcometobeta4 = /** @type {(inputs: Developerportal_Components_Betagate_Welcometobeta4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرحباً بك في النسخة التجريبية!`)
};

/**
* | output |
* | --- |
* | "Welcome to the Beta!" |
*
* @param {Developerportal_Components_Betagate_Welcometobeta4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_welcometobeta4 = /** @type {((inputs?: Developerportal_Components_Betagate_Welcometobeta4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Welcometobeta4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_welcometobeta4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_welcometobeta4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_welcometobeta4(inputs)
	return ar_developerportal_components_betagate_welcometobeta4(inputs)
});
export { developerportal_components_betagate_welcometobeta4 as "developerPortal.components.betaGate.welcomeToBeta" }