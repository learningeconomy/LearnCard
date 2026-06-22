/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Publishdesc3Inputs */

const en_developerportal_components_partnerdashboard_publishdesc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Publishdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share your app with thousands of users. It only takes a few minutes to get started.`)
};

const es_developerportal_components_partnerdashboard_publishdesc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Publishdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte tu aplicación con miles de usuarios. Solo toma unos minutos empezar.`)
};

const fr_developerportal_components_partnerdashboard_publishdesc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Publishdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez votre application avec des milliers d'utilisateurs. Cela ne prend que quelques minutes.`)
};

const ar_developerportal_components_partnerdashboard_publishdesc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Publishdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارك تطبيقك مع آلاف المستخدمين. يستغرق الأمر بضع دقائق فقط للبدء.`)
};

/**
* | output |
* | --- |
* | "Share your app with thousands of users. It only takes a few minutes to get started." |
*
* @param {Developerportal_Components_Partnerdashboard_Publishdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_publishdesc3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Publishdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Publishdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_publishdesc3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_publishdesc3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_publishdesc3(inputs)
	return ar_developerportal_components_partnerdashboard_publishdesc3(inputs)
});
export { developerportal_components_partnerdashboard_publishdesc3 as "developerPortal.components.partnerDashboard.publishDesc" }