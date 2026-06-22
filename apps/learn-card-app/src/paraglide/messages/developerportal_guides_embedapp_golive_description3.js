/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Golive_Description3Inputs */

const en_developerportal_guides_embedapp_golive_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your embedded app integration is complete. Activate it to start using it in production.`)
};

const es_developerportal_guides_embedapp_golive_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La integración de tu aplicación embebida está completa. Actívala para empezar a usarla en producción.`)
};

const fr_developerportal_guides_embedapp_golive_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'intégration de votre application embarquée est terminée. Activez-la pour commencer à l'utiliser en production.`)
};

const ar_developerportal_guides_embedapp_golive_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتمل تكامل تطبيقك المضمن. قم بتنشيطه لبدء استخدامه في الإنتاج.`)
};

/**
* | output |
* | --- |
* | "Your embedded app integration is complete. Activate it to start using it in production." |
*
* @param {Developerportal_Guides_Embedapp_Golive_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_golive_description3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Golive_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Golive_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_golive_description3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_golive_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_golive_description3(inputs)
	return ar_developerportal_guides_embedapp_golive_description3(inputs)
});
export { developerportal_guides_embedapp_golive_description3 as "developerPortal.guides.embedApp.goLive.description" }