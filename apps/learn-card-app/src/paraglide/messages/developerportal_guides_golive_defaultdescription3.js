/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Golive_Defaultdescription3Inputs */

const en_developerportal_guides_golive_defaultdescription3 = /** @type {(inputs: Developerportal_Guides_Golive_Defaultdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You've completed all the setup steps. Activate your integration to start using it in production.`)
};

const es_developerportal_guides_golive_defaultdescription3 = /** @type {(inputs: Developerportal_Guides_Golive_Defaultdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Has completado todos los pasos de configuración. Activa tu integración para empezar a usarla en producción.`)
};

const fr_developerportal_guides_golive_defaultdescription3 = /** @type {(inputs: Developerportal_Guides_Golive_Defaultdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez terminé toutes les étapes de configuration. Activez votre intégration pour l'utiliser en production.`)
};

const ar_developerportal_guides_golive_defaultdescription3 = /** @type {(inputs: Developerportal_Guides_Golive_Defaultdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد أكملت جميع خطوات الإعداد. قم بتفعيل التكامل الخاص بك لبدء استخدامه في الإنتاج.`)
};

/**
* | output |
* | --- |
* | "You've completed all the setup steps. Activate your integration to start using it in production." |
*
* @param {Developerportal_Guides_Golive_Defaultdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_golive_defaultdescription3 = /** @type {((inputs?: Developerportal_Guides_Golive_Defaultdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Golive_Defaultdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_golive_defaultdescription3(inputs)
	if (locale === "es") return es_developerportal_guides_golive_defaultdescription3(inputs)
	if (locale === "fr") return fr_developerportal_guides_golive_defaultdescription3(inputs)
	return ar_developerportal_guides_golive_defaultdescription3(inputs)
});
export { developerportal_guides_golive_defaultdescription3 as "developerPortal.guides.goLive.defaultDescription" }