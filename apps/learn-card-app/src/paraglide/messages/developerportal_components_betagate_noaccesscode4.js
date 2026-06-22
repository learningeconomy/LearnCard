/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Noaccesscode4Inputs */

const en_developerportal_components_betagate_noaccesscode4 = /** @type {(inputs: Developerportal_Components_Betagate_Noaccesscode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Don't have an access code?`)
};

const es_developerportal_components_betagate_noaccesscode4 = /** @type {(inputs: Developerportal_Components_Betagate_Noaccesscode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿No tienes un código de acceso?`)
};

const fr_developerportal_components_betagate_noaccesscode4 = /** @type {(inputs: Developerportal_Components_Betagate_Noaccesscode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'avez pas de code d'accès ?`)
};

const ar_developerportal_components_betagate_noaccesscode4 = /** @type {(inputs: Developerportal_Components_Betagate_Noaccesscode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ليس لديك رمز وصول؟`)
};

/**
* | output |
* | --- |
* | "Don't have an access code?" |
*
* @param {Developerportal_Components_Betagate_Noaccesscode4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_noaccesscode4 = /** @type {((inputs?: Developerportal_Components_Betagate_Noaccesscode4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Noaccesscode4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_noaccesscode4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_noaccesscode4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_noaccesscode4(inputs)
	return ar_developerportal_components_betagate_noaccesscode4(inputs)
});
export { developerportal_components_betagate_noaccesscode4 as "developerPortal.components.betaGate.noAccessCode" }