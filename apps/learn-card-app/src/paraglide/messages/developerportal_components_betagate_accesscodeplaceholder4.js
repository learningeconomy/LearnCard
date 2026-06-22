/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Accesscodeplaceholder4Inputs */

const en_developerportal_components_betagate_accesscodeplaceholder4 = /** @type {(inputs: Developerportal_Components_Betagate_Accesscodeplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your beta access code`)
};

const es_developerportal_components_betagate_accesscodeplaceholder4 = /** @type {(inputs: Developerportal_Components_Betagate_Accesscodeplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Introduce tu código de acceso beta`)
};

const fr_developerportal_components_betagate_accesscodeplaceholder4 = /** @type {(inputs: Developerportal_Components_Betagate_Accesscodeplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entrez votre code d'accès beta`)
};

const ar_developerportal_components_betagate_accesscodeplaceholder4 = /** @type {(inputs: Developerportal_Components_Betagate_Accesscodeplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدخل رمز الوصول التجريبي`)
};

/**
* | output |
* | --- |
* | "Enter your beta access code" |
*
* @param {Developerportal_Components_Betagate_Accesscodeplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_accesscodeplaceholder4 = /** @type {((inputs?: Developerportal_Components_Betagate_Accesscodeplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Accesscodeplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_accesscodeplaceholder4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_accesscodeplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_accesscodeplaceholder4(inputs)
	return ar_developerportal_components_betagate_accesscodeplaceholder4(inputs)
});
export { developerportal_components_betagate_accesscodeplaceholder4 as "developerPortal.components.betaGate.accessCodePlaceholder" }