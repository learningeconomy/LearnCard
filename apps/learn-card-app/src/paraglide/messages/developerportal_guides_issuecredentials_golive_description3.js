/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Golive_Description3Inputs */

const en_developerportal_guides_issuecredentials_golive_description3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You've set up everything needed to issue verifiable credentials via API. Activate your integration to start issuing in production.`)
};

const es_developerportal_guides_issuecredentials_golive_description3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Has configurado todo lo necesario para emitir credenciales verificables a través de la API. Activa tu integración para comenzar a emitir en producción.`)
};

const fr_developerportal_guides_issuecredentials_golive_description3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez configuré tout le nécessaire pour émettre des certificats vérifiables via l'API. Activez votre intégration pour commencer à émettre en production.`)
};

const ar_developerportal_guides_issuecredentials_golive_description3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد قمت بإعداد كل ما يلزم لإصدار مؤهلات قابلة للتحقق عبر API. فعّل التكامل الخاص بك لبدء الإصدار في الإنتاج.`)
};

/**
* | output |
* | --- |
* | "You've set up everything needed to issue verifiable credentials via API. Activate your integration to start issuing in production." |
*
* @param {Developerportal_Guides_Issuecredentials_Golive_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_golive_description3 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Golive_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Golive_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_golive_description3(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_golive_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_golive_description3(inputs)
	return ar_developerportal_guides_issuecredentials_golive_description3(inputs)
});
export { developerportal_guides_issuecredentials_golive_description3 as "developerPortal.guides.issueCredentials.goLive.description" }