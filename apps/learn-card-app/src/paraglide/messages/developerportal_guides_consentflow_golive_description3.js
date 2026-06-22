/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Golive_Description3Inputs */

const en_developerportal_guides_consentflow_golive_description3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You've set up everything needed for consent-based data sharing. Activate your integration to start connecting with users.`)
};

const es_developerportal_guides_consentflow_golive_description3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Has configurado todo lo necesario para el intercambio de datos basado en consentimiento. Activa tu integración para comenzar a conectar con usuarios.`)
};

const fr_developerportal_guides_consentflow_golive_description3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez configuré tout le nécessaire pour le partage de données basé sur le consentement. Activez votre intégration pour commencer à connecter avec les utilisateurs.`)
};

const ar_developerportal_guides_consentflow_golive_description3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد قمت بإعداد كل ما يلزم لمشاركة البيانات القائمة على الموافقة. فعّل التكامل الخاص بك لبدء الاتصال بالمستخدمين.`)
};

/**
* | output |
* | --- |
* | "You've set up everything needed for consent-based data sharing. Activate your integration to start connecting with users." |
*
* @param {Developerportal_Guides_Consentflow_Golive_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_golive_description3 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Golive_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Golive_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_golive_description3(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_golive_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_golive_description3(inputs)
	return ar_developerportal_guides_consentflow_golive_description3(inputs)
});
export { developerportal_guides_consentflow_golive_description3 as "developerPortal.guides.consentFlow.goLive.description" }