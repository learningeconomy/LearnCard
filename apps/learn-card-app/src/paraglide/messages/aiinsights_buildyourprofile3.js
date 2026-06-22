/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Aiinsights_Buildyourprofile3Inputs */

const en_aiinsights_buildyourprofile3 = /** @type {(inputs: Aiinsights_Buildyourprofile3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Build your ${i?.brand} to unlock personalized learning insights and track your skill development journey.`)
};

const es_aiinsights_buildyourprofile3 = /** @type {(inputs: Aiinsights_Buildyourprofile3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Construye tu ${i?.brand} para desbloquear insights de aprendizaje personalizados y seguir tu desarrollo de habilidades.`)
};

const fr_aiinsights_buildyourprofile3 = /** @type {(inputs: Aiinsights_Buildyourprofile3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créez votre ${i?.brand} pour débloquer des insights d'apprentissage personnalisés et suivre votre développement de compétences.`)
};

const ar_aiinsights_buildyourprofile3 = /** @type {(inputs: Aiinsights_Buildyourprofile3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ابنِ ${i?.brand} الخاص بك لفتح رؤى تعلم مخصصة وتتبع رحلة تطوير مهاراتك.`)
};

/**
* | output |
* | --- |
* | "Build your {brand} to unlock personalized learning insights and track your skill development journey." |
*
* @param {Aiinsights_Buildyourprofile3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_buildyourprofile3 = /** @type {((inputs: Aiinsights_Buildyourprofile3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Buildyourprofile3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_buildyourprofile3(inputs)
	if (locale === "es") return es_aiinsights_buildyourprofile3(inputs)
	if (locale === "fr") return fr_aiinsights_buildyourprofile3(inputs)
	return ar_aiinsights_buildyourprofile3(inputs)
});
export { aiinsights_buildyourprofile3 as "aiInsights.buildYourProfile" }