/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Invalidaccesscode4Inputs */

const en_developerportal_components_betagate_invalidaccesscode4 = /** @type {(inputs: Developerportal_Components_Betagate_Invalidaccesscode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid access code. Please check and try again.`)
};

const es_developerportal_components_betagate_invalidaccesscode4 = /** @type {(inputs: Developerportal_Components_Betagate_Invalidaccesscode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código de acceso inválido. Verifica e inténtalo de nuevo.`)
};

const fr_developerportal_components_betagate_invalidaccesscode4 = /** @type {(inputs: Developerportal_Components_Betagate_Invalidaccesscode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code d'accès invalide. Vérifiez et réessayez.`)
};

const ar_developerportal_components_betagate_invalidaccesscode4 = /** @type {(inputs: Developerportal_Components_Betagate_Invalidaccesscode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز وصول غير صالح. تحقق وحاول مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Invalid access code. Please check and try again." |
*
* @param {Developerportal_Components_Betagate_Invalidaccesscode4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_invalidaccesscode4 = /** @type {((inputs?: Developerportal_Components_Betagate_Invalidaccesscode4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Invalidaccesscode4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_invalidaccesscode4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_invalidaccesscode4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_invalidaccesscode4(inputs)
	return ar_developerportal_components_betagate_invalidaccesscode4(inputs)
});
export { developerportal_components_betagate_invalidaccesscode4 as "developerPortal.components.betaGate.invalidAccessCode" }