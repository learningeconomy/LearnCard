/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Betaaccessdesc4Inputs */

const en_developerportal_components_betagate_betaaccessdesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Betaaccessdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This feature is currently in beta. Enter your access code to continue.`)
};

const es_developerportal_components_betagate_betaaccessdesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Betaaccessdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta función está actualmente en beta. Introduce tu código de acceso para continuar.`)
};

const fr_developerportal_components_betagate_betaaccessdesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Betaaccessdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette fonctionnalité est actuellement en version beta. Saisissez votre code d'accès pour continuer.`)
};

const ar_developerportal_components_betagate_betaaccessdesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Betaaccessdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذه الميزة حالياً في مرحلة تجريبية. أدخل رمز الوصول للمتابعة.`)
};

/**
* | output |
* | --- |
* | "This feature is currently in beta. Enter your access code to continue." |
*
* @param {Developerportal_Components_Betagate_Betaaccessdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_betaaccessdesc4 = /** @type {((inputs?: Developerportal_Components_Betagate_Betaaccessdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Betaaccessdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_betaaccessdesc4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_betaaccessdesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_betaaccessdesc4(inputs)
	return ar_developerportal_components_betagate_betaaccessdesc4(inputs)
});
export { developerportal_components_betagate_betaaccessdesc4 as "developerPortal.components.betaGate.betaAccessDesc" }